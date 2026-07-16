import { Module } from '@nestjs/common';
import { StakesController } from './stakes.controller';
import { StakesService } from './stakes.service';

@Module({
  controllers: [StakesController],
  providers: [StakesService],
})
export class StakesModule {}