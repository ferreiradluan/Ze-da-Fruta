import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../common/entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const usuario = this.usuarioRepository.create(createUsuarioDto);
    return this.usuarioRepository.save(usuario);
  }

  findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find();
  }

  findOne(id: number): Promise<Usuario | null> {
    return this.usuarioRepository.findOneBy({ usuariosId : id });
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario | null> {
    const usuario = await this.findOne(id);
    if (!usuario) return null;
    Object.assign(usuario, updateUsuarioDto);
    return this.usuarioRepository.save(usuario);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.usuarioRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}