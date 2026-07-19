import {
  Injectable,
  NotFoundException,
  BadGatewayException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStakeDto } from './dto/create-stake.dto';
import { SHIPSTAKE_ABI } from '../contract/shipstake.abi';
import { publicClient, walletClient, SHIPSTAKE_ADDRESS } from '../chain/chain.client';
import { verifyGithubToken } from '../auth/github-token.util';

function parsePrUrl(prUrl: string) {
  const match = prUrl.match(/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)/);
  if (!match) throw new BadRequestException('Could not parse repo/PR number from URL.');
  const [, owner, name, prNumber] = match;
  return { repo: `${owner}/${name}`, prNumber: Number(prNumber) };
}

@Injectable()
export class StakesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStakeDto) {
    const username = verifyGithubToken(dto.githubToken);
    if (!username) {
      throw new UnauthorizedException('Invalid or expired GitHub session — reconnect GitHub.');
    }

    const { repo, prNumber } = parsePrUrl(dto.prUrl);

    // Real ownership check: the PR must actually belong to the connected
    // GitHub user, otherwise anyone could stake on someone else's merged work.
    const prRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}`);
    if (!prRes.ok) {
      throw new BadRequestException('Could not find that pull request on GitHub.');
    }
    const pr = (await prRes.json()) as { user?: { login?: string } };
    if (!pr.user?.login || pr.user.login.toLowerCase() !== username.toLowerCase()) {
      throw new UnauthorizedException(
        `That PR was opened by @${pr.user?.login ?? 'unknown'}, not @${username}. You can only stake on your own PRs.`,
      );
    }

    return this.prisma.stake.create({
      data: {
        stakeId: dto.stakeId,
        ownerAddress: dto.ownerAddress,
        githubUsername: username,
        amountWei: dto.amountWei,
        repo,
        prNumber,
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
      return { status: 'pending', merged: mergedAt !== null };
    }

    try {
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