import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';

export enum TipoDesconto {
  PERCENTUAL = 'PERCENTUAL',
  FIXO = 'FIXO'
}

@Entity()
export class Cupom extends BaseEntity {
  @Column({ unique: true })
  codigo: string;

  @Column({
    type: 'varchar',
    enum: TipoDesconto,
    default: TipoDesconto.PERCENTUAL
  })
  tipoDesconto: TipoDesconto;

  @Column('decimal', { precision: 10, scale: 2 })
  valor: number;

  @Column()
  dataValidade: Date;

  @Column({ default: true })
  ativo: boolean;

  @Column({ nullable: true })
  valorMinimoCompra: number;

  @Column({ nullable: true })
  valorMaximoDesconto: number;

  @Column({ default: 1 })
  limitesUso: number;

  @Column({ default: 0 })
  vezesUsado: number;

  // Métodos de Negócio
  estaValido(): boolean {
    const agora = new Date();
    return (
      this.ativo &&
      this.dataValidade >= agora &&
      this.vezesUsado < this.limitesUso
    );
  }

  podeSerAplicado(valorCompra: number): boolean {
    return (
      this.estaValido() &&
      (!this.valorMinimoCompra || valorCompra >= this.valorMinimoCompra)
    );
  }

  calcularDesconto(valorCompra: number): number {
    if (!this.podeSerAplicado(valorCompra)) {
      return 0;
    }

    let desconto = 0;
    
    if (this.tipoDesconto === TipoDesconto.PERCENTUAL) {
      desconto = valorCompra * (this.valor / 100);
    } else {
      desconto = this.valor;
    }

    // Aplicar limite máximo de desconto se definido
    if (this.valorMaximoDesconto && desconto > this.valorMaximoDesconto) {
      desconto = this.valorMaximoDesconto;
    }

    // Desconto não pode ser maior que o valor da compra
    return Math.min(desconto, valorCompra);
  }

  usar(): void {
    if (!this.estaValido()) {
      throw new Error('Cupom inválido ou expirado');
    }
    this.vezesUsado++;
  }
}
