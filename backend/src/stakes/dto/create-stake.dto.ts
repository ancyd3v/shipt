import { IsInt, IsString, IsDateString, Matches, Min } from 'class-validator';

export class CreateStakeDto {
  @IsInt()
  stakeId: number;

  @Matches(/^0x[a-fA-F0-9]{40}$/)
  ownerAddress: string;

  @IsString()
  amountWei: string;

  @Matches(
    /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+\/?$/,
    { message: 'Must be a GitHub pull request URL, e.g. https://github.com/owner/repo/pull/42' },
  )
  prUrl: string;

  @IsString()
  githubToken: string;

  @IsDateString()
  deadline: string;
}