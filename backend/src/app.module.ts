import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { StakesModule } from './stakes/stakes.module';

@Module({
  imports: [PrismaModule, StakesModule],
})
export class AppModule {}