import { Module } from '@nestjs/common';
import { DependencyService } from './dependency/dependency.service';
import { DependencyController } from './dependency/dependency.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dependency } from './dependency.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dependency])],
  providers: [DependencyService],
  controllers: [DependencyController]
})
export class DependencyModule {}
