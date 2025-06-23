import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export const PERFIL_USUARIO = {
  CLIENTE: 'cliente',
  VENDEDOR: 'vendedor',
  ENTREGADOR: 'entregador',
} as const;

export type PerfilUsuario = typeof PERFIL_USUARIO[keyof typeof PERFIL_USUARIO];

export const STATUS_APROVACAO_PERFIL = {
  APROVADO: 'aprovado',
  PENDENTE: 'pendente',
} as const;

export type StatusAprovacaoPerfil = typeof STATUS_APROVACAO_PERFIL[keyof typeof STATUS_APROVACAO_PERFIL];

@Entity({ name: 'perfil_usuario_entity' })
export class PerfilUsuarioEntity {
  @PrimaryGeneratedColumn({ name: 'perfil_usuario_entityId' })
  perfilUsuarioEntityId!: number;
  @ManyToOne(() => User, (user) => user.perfil)
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  usuario!: User;

  @Column({ type: 'varchar' })
  perfil!: PerfilUsuario;

  @Column({ type: 'varchar', default: STATUS_APROVACAO_PERFIL.PENDENTE })
  status_aprovacao!: StatusAprovacaoPerfil;
}

