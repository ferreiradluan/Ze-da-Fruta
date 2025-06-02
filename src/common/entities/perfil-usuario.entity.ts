import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PerfilUsuario {
  CLIENTE = 'cliente',
  VENDEDOR = 'vendedor',
  ENTREGADOR = 'entregador',
}

export enum StatusAprovacaoPerfil {
  APROVADO = 'aprovado',
  PENDENTE = 'pendente',
}

@Entity({ name: 'perfil_usuario_entity' })
export class PerfilUsuarioEntity {
  @PrimaryGeneratedColumn({ name: 'perfil_usuario_entityId' })
  perfilUsuarioEntityId!: number;

  @ManyToOne(() => User, (user) => user.perfis)
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  usuario!: User;

  @Column({ type: 'varchar' })
  perfil!: PerfilUsuario;

  @Column({ type: 'varchar', default: StatusAprovacaoPerfil.PENDENTE })
  status_aprovacao!: StatusAprovacaoPerfil;
}

