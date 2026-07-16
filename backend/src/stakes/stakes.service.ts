import {
  Injectable,
  NotFoundException,
  BadGatewayException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStakeDto } from './dto/create-stake.dto';
import { SHIPSTAKE_ABI } from '../contract/shipstake.abi';
import { publicClient, walletClient, SHIPSTAKE_ADDRESS } from '../chain/chain.client';

@Injectable()
export class StakesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateStakeDto) {
    return this.prisma.stake.create({
      data: {
        stakeId: dto.stakeId,
        ownerAddress: dto.ownerAddress,
        amountWei: dto.amountWei,
        repo: dto.repo,
        prNumber: dto.prNumber,
        deadline: new Date(dto.deadline),
      },
    });
  }

  findAll(ownerAddress?: string) {
    return this.prisma.stake.findMany({
      where: ownerAddress ? { ownerAddress } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkAndResolve(stakeId: number) {
    const stake = await this.prisma.stake.findUnique({ where: { stakeId } });
    if (!stake) throw new NotFoundException('Stake not found');
    if (stake.resolved) {
      return { status: 'already-resolved', shipped: stake.shipped };
    }

    const res = await fetch(
      `https://api.github.com/repos/${stake.repo}/pulls/${stake.prNumber}`,
    );
    if (!res.ok) {
      throw new BadGatewayException('Failed to reach GitHub API');
    }
    const pr = (await res.json()) as { merged_at: string | null };
    const mergedAt = pr.merged_at ? new Date(pr.merged_at) : null;
    const shippedInTime =
      mergedAt !== null && mergedAt > stake.createdAt && mergedAt <= stake.deadline;
    const pastDeadline = new Date() > stake.deadline;

    if (!shippedInTime && !pastDeadline) {
      // not merged yet, deadline hasn't passed - nothing to resolve
      return { status: 'pending', merged: mergedAt !== null };
    }

    try {
      // Explicit gas: estimate ourselves, add only a 10% buffer.
      // On Monad, gas is charged on the limit set, not gas actually used,
      // so we never let a wallet's fallback estimate decide this.
      const gasEstimate = await publicClient.estimateContractGas({
        address: SHIPSTAKE_ADDRESS,
        abi: SHIPSTAKE_ABI,
        functionName: 'resolve',
        args: [BigInt(stake.stakeId), shippedInTime],
        account: walletClient.account,
      });
      const gasLimit = gasEstimate + gasEstimate / 10n;

      const hash = await walletClient.writeContract({
        address: SHIPSTAKE_ADDRESS,
        abi: SHIPSTAKE_ABI,
        functionName: 'resolve',
        args: [BigInt(stake.stakeId), shippedInTime],
        gas: gasLimit,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      await this.prisma.stake.update({
        where: { stakeId },
        data: { resolved: true, shipped: shippedInTime, resolvedTxHash: hash },
      });

      return { status: 'resolved', shipped: shippedInTime, txHash: hash };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Chain says it's already resolved but our DB disagrees (e.g. DB was
      // reset during testing) — sync the DB to match reality instead of
      // erroring forever on every future check.
      if (message.includes('AlreadyResolved')) {
        await this.prisma.stake.update({
          where: { stakeId },
          data: { resolved: true },
        });
        return {
          status: 'already-resolved-onchain',
          note: 'Chain had this stake resolved already; local record was out of sync and has been corrected.',
        };
      }

      if (message.includes('InvalidStake')) {
        throw new ConflictException(
          'No on-chain stake exists at this ID yet — createStake() was never called for it.',
        );
      }

      throw new ConflictException(`On-chain resolve failed: ${message.split('\n')[0]}`);
    }
  }
}