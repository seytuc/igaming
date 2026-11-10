import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserCreateRequestDto } from './dto/user-create.request.dto';
import { UserRepository } from './user.repository';
import { FindAllRequestDto } from './dto/find-all.request.dto';
import { PatchRequestDto } from './dto/update.request.dto';
import { AuditLogAction, AuditLogEntityType } from '@app/contracts';
import { OutboxRepository } from '../outbox/outbox.repository';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

const EMAIL_ALREADY_REGISTERED = 'Email is already registered';

@Injectable()
export class UserService {
  private logger: Logger;

  constructor(
    private readonly appRepository: UserRepository,
    private readonly outboxRepository: OutboxRepository,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {
    this.logger = new Logger(UserService.name);
  }
  public async create(dto: UserCreateRequestDto, requestId: string) {
    const existingUser = await this.appRepository.findOneByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException(EMAIL_ALREADY_REGISTERED);
    }

    const user = await this.sequelize.transaction(async (tx) => {
      const createdUser = await this.appRepository.create(dto, tx);
      await this.outboxRepository.enqueue(
        AuditLogEntityType.AUDIT_LOG_ENTITY_TYPE_USER,
        AuditLogAction.AUDIT_LOG_ACTION_USER_CREATED,
        createdUser.id,
        requestId,
        tx,
      );
      return createdUser;
    });

    this.logger.log({
      action: 'user_created',
      userId: user.id,
      requestId,
    });

    return { user, requestId };
  }
  public findAll(dto: FindAllRequestDto) {
    return this.appRepository.findAll(dto);
  }
  public async patch(id: string, dto: PatchRequestDto, requestId: string) {
    const { email, name } = dto;
    if (email === undefined && name === undefined)
      throw new BadRequestException('provide any fileds');
    const isExistId = await this.appRepository.findOne(id);
    if (!isExistId) throw new NotFoundException('Not found user by id');
    if (dto.email) {
      const existingUser = await this.appRepository.findOneByEmail(
        dto.email,
        id,
      );
      if (existingUser) {
        throw new ConflictException(EMAIL_ALREADY_REGISTERED);
      }
    }

    const user = await this.sequelize.transaction(async (tx) => {
      const [count, users] = await this.appRepository.patch(id, dto, tx);
      if (count === 0) throw new NotFoundException('User not found');
      await this.outboxRepository.enqueue(
        AuditLogEntityType.AUDIT_LOG_ENTITY_TYPE_USER,
        AuditLogAction.AUDIT_LOG_ACTION_USER_UPDATED,
        users[0].id,
        requestId,
        tx,
      );
      return users[0];
    });

    this.logger.log({
      action: AuditLogAction.AUDIT_LOG_ACTION_USER_UPDATED,
      userId: user.id,
      requestId,
    });

    return { user, requestId };
  }

  public async findOne(id: string) {
    const user = await this.appRepository.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  public async delete(id: string, requestId: string) {
    await this.sequelize.transaction(async (tx) => {
      const response = await this.appRepository.softDelete(id, tx);
      if (response === 0) throw new NotFoundException('User not found');
      await this.outboxRepository.enqueue(
        AuditLogEntityType.AUDIT_LOG_ENTITY_TYPE_USER,
        AuditLogAction.AUDIT_LOG_ACTION_USER_DELETED,
        id,
        requestId,
        tx,
      );
    });
    this.logger.log({
      action: AuditLogAction.AUDIT_LOG_ACTION_USER_DELETED,
      userId: id,
      requestId,
    });
  }
}
