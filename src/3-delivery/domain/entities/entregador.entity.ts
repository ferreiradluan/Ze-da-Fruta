import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';

export enum StatusEntregador {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  SUSPENSO = 'SUSPENSO',
}

export enum StatusDisponibilidade {
  DISPONIVEL = 'DISPONIVEL',
  EM_ENTREGA = 'EM_ENTREGA',
  INDISPONIVEL = 'INDISPONIVEL',
}

@Entity()
export class Entregador extends BaseEntity {
  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;
  @Column({ unique: true })
  telefone: string;
  @Column({ type: 'text', nullable: true })
  fotoPerfil: string | null; // URL/caminho da foto de perfil

  @Column({
    type: 'text',
    default: StatusEntregador.ATIVO,
  })
  status: StatusEntregador;

  @Column({
    type: 'text',
    default: StatusDisponibilidade.INDISPONIVEL,
  })
  disponibilidade: StatusDisponibilidade;

  @Column({ nullable: true })
  veiculoInfo: string; // Informações do veículo (moto, bicicleta, etc.)

  @Column({ nullable: true })
  cnh: string; // Número da CNH

  @Column({ default: 0 })
  avaliacaoMedia: number; // Avaliação média de 0 a 5

  @Column({ default: 0 })
  totalEntregas: number; // Total de entregas realizadas

  // TODO: Adicionar relacionamento com entregas quando implementar
  // @OneToMany(() => Entrega, entrega => entrega.entregador)
  // entregas: Entrega[];
}
