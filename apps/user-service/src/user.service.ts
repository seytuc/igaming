import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { UserCreateRequestDto } from './models/user/dto/user-create.request.dto';
import { UserRepository } from './user.repository';
import { FindAllRequestDto } from './models/user/dto/find-all.request.dto';
import { PatchRequestDto } from './models/user/dto/update.request.dto';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  AuditLogAction,
  AuditLogEntityType,
  AuditServiceClient,
} from '@app/contracts';
import { AuditPublisher } from './audit.publisher';

@Injectable()
export class UserService {
  private auditClient: AuditServiceClient;
  private logger: Logger;
  constructor(
    private readonly appRepository: UserRepository,
    private readonly auditPublisher: AuditPublisher,
    @Inject('AUDIT_PACKAGE') private readonly client: ClientGrpc,
  ) {
    this.auditClient = client.getService<AuditServiceClient>('AuditService');
    this.logger = new Logger(UserService.name);
  }
  public async create(dto: UserCreateRequestDto, requestId: string) {
    const existingUser = await this.appRepository.findOne(dto.email);
    if (existingUser) {
      throw new ConflictException('Email is already exist');
    }

    const user = await this.appRepository.create(dto);

    await this.auditPublisher.publish(
      AuditLogEntityType.AUDIT_LOG_ENTITY_TYPE_USER,
      AuditLogAction.AUDIT_LOG_ACTION_USER_CREATED,
      user.id,
      requestId,
    );
    return user;
  }
  public findAll(dto: FindAllRequestDto) {
    return this.appRepository.findAll(dto);
  }
  public async patch(id: string, dto: PatchRequestDto, requestId: string) {
    const affectedCount = await this.appRepository.patch(id, dto);
    if (affectedCount[0] === 0) return affectedCount;

    await this.auditPublisher.publish(
      AuditLogEntityType.AUDIT_LOG_ENTITY_TYPE_USER,
      AuditLogAction.AUDIT_LOG_ACTION_USER_UPDATED,
      id,
      requestId,
    );

    return affectedCount;
  }
  public async delete(id: string, requestId: string) {
    const response = await this.appRepository.softDelete(id);
    if (response === 0) return;
    await this.auditPublisher.publish(
      AuditLogEntityType.AUDIT_LOG_ENTITY_TYPE_USER,
      AuditLogAction.AUDIT_LOG_ACTION_USER_DELETED,
      id,
      requestId,
    );
  }
}
