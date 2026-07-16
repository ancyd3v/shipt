import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { StakesService } from './stakes.service';
import { CreateStakeDto } from './dto/create-stake.dto';

@Controller('stakes')
export class StakesController {
  constructor(private readonly stakesService: StakesService) {}

  @Post()
  create(@Body() dto: CreateStakeDto) {
    return this.stakesService.create(dto);
  }

  @Get()
  findAll(@Query('ownerAddress') ownerAddress?: string) {
    return this.stakesService.findAll(ownerAddress);
  }

  @Post(':stakeId/check')
  check(@Param('stakeId', ParseIntPipe) stakeId: number) {
    return this.stakesService.checkAndResolve(stakeId);
  }
}