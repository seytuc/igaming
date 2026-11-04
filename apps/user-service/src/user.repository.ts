import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user/user.model';
import { UserCreateRequestDto } from './models/user/dto/user-create.request.dto';
import { FindAllRequestDto } from './models/user/dto/find-all.request.dto';
import { Op, type WhereOperators } from 'sequelize';
import { PatchRequestDto } from './models/user/dto/update.request.dto';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}
  public async create(dto: UserCreateRequestDto) {
    const { email, name } = dto;
    return this.userModel.create({ email, name });
  }

  public findOne(email: string) {
    return this.userModel.findOne({
      where: { email },
      paranoid: false,
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

  public patch(id: string, dto: PatchRequestDto) {
    const { email, name } = dto;
    const data: {
      name?: string;
      email?: string;
    } = {};
    if (name) data.name = name;
    if (email) data.email = email;
    return this.userModel.update(data, { where: { id } });
  }

  public softDelete(id: string) {
    return this.userModel.destroy({ where: { id } });
  }
}
