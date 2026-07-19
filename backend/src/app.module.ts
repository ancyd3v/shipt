import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { StakesModule } from './stakes/stakes.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, StakesModule, AuthModule],
})
export class AppModule {}