import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Usuario } from './usuario.entity';

@Entity('enderecos')
export class Endereco extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  apelido!: string;

  @Column({ type: 'varchar', length: 255 })
  rua!: string;

  @Column({ type: 'varchar', length: 20 })
  numero!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  complemento?: string;

  @Column({ type: 'varchar', length: 100 })
  bairro!: string;

  @Column({ type: 'varchar', length: 100 })
  cidade!: string;

  @Column({ type: 'varchar', length: 2 })
  estado!: string;

  @Column({ type: 'varchar', length: 8 })
  cep!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ type: 'boolean', default: false })
  principal!: boolean;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @ManyToOne(() => Usuario, (usuario) => usuario.enderecos, { onDelete: 'CASCADE' })
  usuario!: Usuario;

  // === MÉTODOS DE DOMÍNIO RICO ===
  definirComoPrincipal(): void {
    this.principal = true;
  }

  desativar(): void {
    this.ativo = false;
  }

  isPrincipal(): boolean {
    return this.principal;
  }
  isAtivo(): boolean {
    return this.ativo;
  }

  getEnderecoCompleto(): string {
    const complementoStr = this.complemento ? `, ${this.complemento}` : '';
    return `${this.rua}, ${this.numero}${complementoStr}, ${this.bairro}, ${this.cidade}/${this.estado} - CEP: ${this.cep}`;
  }
}
