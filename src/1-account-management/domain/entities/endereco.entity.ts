import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Usuario } from './usuario.entity';

@Entity()
export class Endereco extends BaseEntity {
  @Column()
  rua: string;

  @Column()
  numero: string;

  @Column()
  cidade: string;

  @Column()
  estado: string;

  @Column()
  cep: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.enderecos)
  usuario: Usuario;
}
