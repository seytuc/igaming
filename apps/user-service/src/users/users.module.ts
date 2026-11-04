import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditClientModule } from '../audit-client/audit-client.module';
import { User } from './models/user.model';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [SequelizeModule.forFeature([User]), AuditClientModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UsersModule {}
