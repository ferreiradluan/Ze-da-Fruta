import { Entity, Column, PrimaryColumn } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

@Entity('platform_settings')
export class PlatformSetting {
  @PrimaryColumn()
  key!: string;

  @Column()
  value!: string;

  @Column({ nullable: true })
  description?: string;

  // Domínio Rico - Lógica de negócio encapsulada
  atualizarValor(novoValor: string): void {
    this.validarValor(novoValor);
    this.value = novoValor;
  }

  validarValor(valor: string): void {
    if (!valor || valor.trim().length === 0) {
      throw new BadRequestException('Valor da configuração não pode ser vazio');
    }
  }
}
