import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserCreateRequestDto } from './dto/user-create.request.dto';
import { FindAllRequestDto } from './dto/find-all.request.dto';
import { PatchRequestDto } from './dto/update.request.dto';
import { CorrelationId } from '../../../../libs/decorators/correlation-id.decorator';

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

  @Get(':id')
  public async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appService.findOne(id);
  }

  @Get()
  public async findAll(@Query() dto: FindAllRequestDto) {
    return this.appService.findAll(dto);
  }

  @Patch(':id')
  public async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchRequestDto,
    @CorrelationId() requestId: string,
  ) {
    return this.appService.patch(id, dto, requestId);
  }

  @Delete(':id')
  public async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CorrelationId() requestId: string,
  ) {
    return this.appService.delete(id, requestId);
  }
}
