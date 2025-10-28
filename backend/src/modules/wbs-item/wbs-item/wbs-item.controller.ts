import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { WbsItemService } from './wbs-item.service';
import { CreateWbsItemDto } from '../dto/create-wbs-item.dto';
import { UpdateWbsItemDto } from '../dto/update-wbs-item.dto';

@Controller('wbs-items')
export class WbsItemController {
  constructor(private readonly wbsService: WbsItemService) {}

  @Post()
  create(@Body() dto: CreateWbsItemDto) {
    return this.wbsService.create(dto);
  }

  @Get()
  findAll() {
    return this.wbsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wbsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWbsItemDto) {
    return this.wbsService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wbsService.remove(+id);
  }
}
