import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';
import { UserAccount } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserAccount])],
  controllers: [DevController],
  providers: [DevService],
})
export class DevModule {}


