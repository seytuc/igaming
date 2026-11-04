import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { AuditLogAction } from '@app/contracts';

@Table({
  tableName: 'audit_logs',
  timestamps: true,
  underscored: true,
})
export class AuditLog extends Model<
  InferAttributes<AuditLog>,
  InferCreationAttributes<AuditLog>
> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING, allowNull: false })
  action: AuditLogAction;

  @Column({ type: DataType.SMALLINT, allowNull: false })
  entityType: number;

  @Column({ type: DataType.STRING, allowNull: false })
  entityId: string;

  @Column({ type: DataType.UUID, allowNull: false })
  requestId: string;

  @Column({ type: DataType.DATE, allowNull: false })
  timestamp: Date;
}
