import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { EntregasService } from './entregas.service';
import { Entrega } from '../common/entities/entrega.entity';

@Controller('entregas')
export class EntregasController {
  constructor(private readonly entregasService: EntregasService) {}

  @Post()
  create(@Body() entrega: Entrega): Promise<Entrega> {
    return this.entregasService.create(entrega);
  }

  @Get()
  findAll(): Promise<Entrega[]> {
    return this.entregasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Entrega | null> {
    return this.entregasService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() entrega: Partial<Entrega>): Promise<Entrega | null> {
    return this.entregasService.update(id, entrega);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<boolean> {
    return this.entregasService.remove(id);
  }
}