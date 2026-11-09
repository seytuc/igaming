import { Column, DataType, Model, Table } from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes } from 'sequelize';
import type { EventRecordRequest } from '@app/contracts';

@Table({
  tableName: 'outbox',
  timestamps: false,
})
export class OutboxEvent extends Model<
  InferAttributes<OutboxEvent>,
  InferCreationAttributes<OutboxEvent>
> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
  })
  declare id: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare event: EventRecordRequest;

  @Column({
    field: 'request_id',
    type: DataType.UUID,
    allowNull: false,
  })
  declare requestId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare attempts: number;

  @Column({
    field: 'available_at',
    type: DataType.DATE,
    allowNull: false,
  })
  declare availableAt: Date;
}
