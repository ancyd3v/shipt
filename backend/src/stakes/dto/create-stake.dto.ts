import { IsInt, IsString, IsDateString, Matches, Min } from 'class-validator';

export class CreateStakeDto {
  @IsInt()
  stakeId: number;

  @Matches(/^0x[a-fA-F0-9]{40}$/)
  ownerAddress: string;

  @IsString()
  amountWei: string;

  @Matches(/^[\w.-]+\/[\w.-]+$/, { message: 'repo must be in "owner/name" format' })
  repo: string;

  @IsInt()
  @Min(1)
  prNumber: number;

  @IsDateString()
  deadline: string;
}