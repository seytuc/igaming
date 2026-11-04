import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserCreateRequestDto } from './models/user/dto/user-create.request.dto';
import { FindAllRequestDto } from './models/user/dto/find-all.request.dto';
import { PatchRequestDto } from './models/user/dto/update.request.dto';
import { CorrelationId } from '../../../libs/decorators/correlation-id.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly appService: UserService) {}

  @Post()
  public async create(
    @Body() dto: UserCreateRequestDto,
    @CorrelationId() requestId: string,
  ) {
    return this.appService.create(dto, requestId);
  }

  @Get()
  public async findAll(@Query() dto: FindAllRequestDto) {
    return this.appService.findAll(dto);
  }

  @Patch(':id')
  public async patch(
    @Param('id') id: string,
    @Body() dto: PatchRequestDto,
    @CorrelationId() requestId: string,
  ) {
    return this.appService.patch(id, dto, requestId);
  }

  @Delete(':id')
  public async delete(
    @Param('id') id: string,
    @CorrelationId() requestId: string,
  ) {
    return this.appService.delete(id, requestId);
  }
}
