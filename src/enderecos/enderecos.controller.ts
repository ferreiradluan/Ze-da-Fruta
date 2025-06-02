import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { EnderecosService } from './enderecos.service';
import { Endereco } from '../common/entities/endereco.entity';
import { CreateEnderecoDto } from './dto/create-endereco.dto';

@Controller('enderecos')
export class EnderecosController {
  constructor(private readonly enderecosService: EnderecosService) {}

  @Post()
  create(@Body() endereco: CreateEnderecoDto): Promise<Endereco> {
    return this.enderecosService.create(endereco as Endereco);
  }

  @Get()
  findAll(): Promise<Endereco[]> {
    return this.enderecosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Endereco | null> {
    return this.enderecosService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() endereco: Partial<Endereco>): Promise<Endereco | null> {
    return this.enderecosService.update(id, endereco);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<boolean> {
    return this.enderecosService.remove(id);
  }
}