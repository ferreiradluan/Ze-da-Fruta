import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Usuario } from './usuario.entity';

@Entity()
export class Role extends BaseEntity {
  @Column({ unique: true })
  nome: string;

  @ManyToMany(() => Usuario, (usuario) => usuario.roles)
  usuarios: Usuario[];
}
