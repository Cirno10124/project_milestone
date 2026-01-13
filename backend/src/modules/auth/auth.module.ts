import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserAccount } from './entities/user.entity';
import { EmailCodeService } from './email-code.service';
import { EmailSenderService } from './email-sender.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserAccount]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, EmailCodeService, EmailSenderService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, EmailSenderService],
})
export class AuthModule {}
