import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { DependencyService } from './dependency.service';
import { CreateDependencyDto } from '../dto/create-dependency.dto';
import { UpdateDependencyDto } from '../dto/update-dependency.dto';

@Controller('dependencies')
export class DependencyController {
  constructor(private readonly depService: DependencyService) {}

  @Post()
  create(@Body() dto: CreateDependencyDto) {
    return this.depService.create(dto);
  }

  @Get()
  findAll() {
    return this.depService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.depService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDependencyDto) {
    return this.depService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.depService.remove(+id);
  }
}
