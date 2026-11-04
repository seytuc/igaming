import { ConflictException, Injectable } from '@nestjs/common';
import { UserCreateRequestDto } from './dto/user-create.request.dto';
import { UserRepository } from './user.repository';
import { FindAllRequestDto } from './dto/find-all.request.dto';
import { PatchRequestDto } from './dto/update.request.dto';
import { AuditLogAction, AuditLogEntityType } from '@app/contracts';
import { AuditGrpcClient } from '../audit-client/audit-grpc.client';

const EMAIL_ALREADY_REGISTERED = 'Email is already registered';

@Injectable()
export class UserService {
  constructor(
    private readonly appRepository: UserRepository,
    private readonly auditClient: AuditGrpcClient,
  ) {}
  public async create(dto: UserCreateRequestDto, requestId: string) {
    const existingUser = await this.appRepository.findOne(dto.email);
    if (existingUser) {
      throw new ConflictException(EMAIL_ALREADY_REGISTERED);
    }

    const user = await this.appRepository.create(dto);

    await this.auditClient.recordEvent(
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
    if (dto.email) {
      const existingUser = await this.appRepository.findOne(dto.email, id);
      if (existingUser) {
        throw new ConflictException(EMAIL_ALREADY_REGISTERED);
      }
    }

    const affectedCount = await this.appRepository.patch(id, dto);
    if (affectedCount[0] === 0) return affectedCount;

    await this.auditClient.recordEvent(
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
    await this.auditClient.recordEvent(
      AuditLogEntityType.AUDIT_LOG_ENTITY_TYPE_USER,
      AuditLogAction.AUDIT_LOG_ACTION_USER_DELETED,
      id,
      requestId,
    );
  }
}
