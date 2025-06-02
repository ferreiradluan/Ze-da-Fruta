import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { EstabelecimentosService } from './estabelecimentos.service';
import { Estabelecimento } from '../common/entities/estabelecimento.entity';

@Controller('estabelecimentos')
export class EstabelecimentosController {
  constructor(private readonly estabelecimentosService: EstabelecimentosService) {}

  @Post()
  create(@Body() estabelecimento: Estabelecimento): Promise<Estabelecimento> {
    return this.estabelecimentosService.create(estabelecimento);
  }

  @Get()
  findAll(): Promise<Estabelecimento[]> {
    return this.estabelecimentosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Estabelecimento | null> {
    return this.estabelecimentosService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() estabelecimento: Partial<Estabelecimento>): Promise<Estabelecimento | null> {
    return this.estabelecimentosService.update(id, estabelecimento);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<boolean> {
    return this.estabelecimentosService.remove(id);
  }
}