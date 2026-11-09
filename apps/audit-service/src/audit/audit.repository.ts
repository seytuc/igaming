import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from './models/audit-log.model';
import { Op, type WhereOperators } from 'sequelize';
import type { FindAuditLogsRequestDto } from './dto/find-audit-logs.request.dto';

export type AuditLogCreateData = Pick<
  AuditLog,
  'id' | 'action' | 'entityType' | 'entityId' | 'requestId' | 'timestamp'
>;

export class AuditRepository {
  constructor(@InjectModel(AuditLog) private readonly audit: typeof AuditLog) {}

  public async findAll(dto: FindAuditLogsRequestDto) {
    const { page, limit, entity_type, action, timestamp_from, timestamp_to } =
      dto;
    const where: {
      entityType?: number;
      action?: AuditLog['action'];
      timestamp?: WhereOperators<Date>;
    } = {};

    if (entity_type != null) where.entityType = entity_type;
    if (action != null) where.action = action;
    if (timestamp_from) {
      where.timestamp ??= {};
      where.timestamp[Op.gte] = new Date(timestamp_from);
    }
    if (timestamp_to) {
      where.timestamp ??= {};
      where.timestamp[Op.lt] = new Date(timestamp_to);
    }

    const { rows, count } = await this.audit.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      items: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  public async create(data: AuditLogCreateData) {
    await this.audit.findOrCreate({
      where: { id: data.id },
      defaults: data,
    });

    return {};
  }
}
