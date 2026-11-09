import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { UserCreateRequestDto } from './dto/user-create.request.dto';
import { FindAllRequestDto } from './dto/find-all.request.dto';
import { Op, Transaction, type WhereOperators } from 'sequelize';
import { PatchRequestDto } from './dto/update.request.dto';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}
  public async create(dto: UserCreateRequestDto, transaction: Transaction) {
    const { email, name } = dto;
    return this.userModel.create({ email, name }, { transaction });
  }

  public findOneByEmail(email: string, excludeId?: string) {
    return this.userModel.findOne({
      where: excludeId ? { email, id: { [Op.ne]: excludeId } } : { email },
      paranoid: false,
    });
  }
  public async findOne(id: string) {
    return this.userModel.findOne({
      where: { id },
    });
  }

  public async findAll(dto: FindAllRequestDto) {
    const {
      page,
      email,
      name,
      created_from,
      created_to,
      sort_by,
      sort_dir,
      limit,
    } = dto;

    const where: {
      name?: WhereOperators<string>;
      email?: WhereOperators<string>;
      createdAt?: WhereOperators<Date>;
    } = {};

    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (email) where.email = { [Op.iLike]: `%${email}%` };
    if (created_from) {
      where.createdAt ??= {};
      where.createdAt[Op.gte] = new Date(created_from);
    }
    if (created_to) {
      where.createdAt ??= {};
      where.createdAt[Op.lt] = new Date(created_to);
    }
    if (created_from && created_to) {
      if (new Date(created_to).getTime() < new Date(created_from).getTime())
        throw new BadRequestException(
          'created_from must not be later than created_to',
        );
    }

    const sortByField = sort_by === 'created_at' ? 'createdAt' : sort_by;
    const sortDirField = sort_dir === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      order: [[sortByField, sortDirField]],
      limit,
      offset,
    });
    return {
      items: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  public patch(id: string, dto: PatchRequestDto, transaction: Transaction) {
    const { email, name } = dto;
    const data: {
      name?: string;
      email?: string;
    } = {};
    if (name) data.name = name;
    if (email) data.email = email;
    return this.userModel.update(data, {
      where: { id },
      returning: true,
      transaction,
    });
  }

  public softDelete(id: string, transaction: Transaction) {
    return this.userModel.destroy({ where: { id }, transaction });
  }
}
