import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

@Table({
  tableName: 'users',
  timestamps: true,
  paranoid: true,
})
export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4(),
  })
  declare id: CreationOptional<string>;

  @Column
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ field: 'created_at', type: DataType.DATE, allowNull: false })
  declare createdAt: CreationOptional<Date>;

  @Column({ field: 'updated_at', type: DataType.DATE, allowNull: false })
  declare updatedAt: CreationOptional<Date>;

  @Column({ field: 'deleted_at', type: DataType.DATE, allowNull: true })
  declare deletedAt: Date | null;
}
