import { Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Usuario } from './usuario.entity';

@Entity()
export class Endereco extends BaseEntity {
  // Campos específicos omitidos conforme nota do diagrama
  // que foca nos métodos de negócio
  
  @ManyToOne(() => Usuario, (usuario) => usuario.enderecos)
  usuario: Usuario;
}
