import { Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Usuario } from './usuario.entity';

@Entity()
export class PerfilUsuario extends BaseEntity {
  // Campos específicos omitidos conforme nota do diagrama
  // que foca nos métodos de negócio
  
  @OneToOne(() => Usuario, (usuario) => usuario.perfil)
  usuario: Usuario;
}
