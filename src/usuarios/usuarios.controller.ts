import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Usuario } from '../common/entities/usuario.entity';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(@Body() usuario: Usuario): Promise<Usuario> {
    return this.usuariosService.create(usuario);
  }

  @Get()
  findAll(): Promise<Usuario[]> {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Usuario | null> {
    return this.usuariosService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() usuario: Partial<Usuario>): Promise<Usuario | null> {
    return this.usuariosService.update(id, usuario);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<boolean> {
    return this.usuariosService.remove(id);
  }
}