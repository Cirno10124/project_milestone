import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrgMember } from './entities/org-member.entity';
import { OrgService } from './org.service';
import { OrgController } from './org.controller';
import { UserAccount } from '../auth/entities/user.entity';
import { OrgGuard } from '../../common/guards/org.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrgMember, UserAccount])],
  providers: [OrgService, OrgGuard],
  controllers: [OrgController],
  exports: [TypeOrmModule, OrgGuard],
})
export class OrgModule {}


