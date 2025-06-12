import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Usuario } from './usuario.entity';

@Entity()
export class PerfilUsuario extends BaseEntity {
  @Column()
  descricao: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.perfis)
  usuario: Usuario;
}
