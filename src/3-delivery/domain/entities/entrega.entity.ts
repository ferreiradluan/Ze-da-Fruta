import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { StatusEntrega, StatusEntregaType, isValidStatusEntrega } from '../constants/status-entrega.constants';
import { EnderecoVO } from '../value-objects/endereco-vo';

@Entity('entregas')
export class Entrega {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  pedidoId!: string;

  @Column({ nullable: true })
  entregadorId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: StatusEntrega.AGUARDANDO_ACEITE
  })
  status!: StatusEntregaType;

  @Column('text', { nullable: true })
  enderecoColeta!: string; // JSON string do EnderecoVO

  @Column('text', { nullable: true })
  enderecoEntrega!: string; // JSON string do EnderecoVO

  @Column({ type: 'datetime', nullable: true })
  dataEstimada!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ✅ MÉTODOS DO DIAGRAMA (Domínio Rico)
  aceitar(entregadorId: string): void {
    if (this.status !== StatusEntrega.AGUARDANDO_ACEITE) {
      throw new Error('Entrega não está disponível para aceite');
    }
    this.entregadorId = entregadorId;
    this.status = StatusEntrega.ACEITA;
  }

  marcarComoColetado(): void {
    if (this.status !== StatusEntrega.A_CAMINHO_DA_LOJA) {
      throw new Error('Entregador deve estar a caminho da loja');
    }
    this.status = StatusEntrega.COLETADO;
  }

  marcarComoEntregue(): void {
    if (this.status !== StatusEntrega.EM_TRANSPORTE) {
      throw new Error('Entrega deve estar em transporte');
    }
    this.status = StatusEntrega.ENTREGUE;
  }

  cancelar(motivo?: string): void {
    if (this.status === StatusEntrega.ENTREGUE) {
      throw new Error('Não é possível cancelar entrega já realizada');
    }
    this.status = StatusEntrega.CANCELADA;
  }

  // Métodos para trabalhar com EnderecoVO
  getEnderecoColeta(): EnderecoVO | null {
    if (!this.enderecoColeta) return null;
    const data = JSON.parse(this.enderecoColeta);
    return new EnderecoVO(data.rua, data.numero, data.cidade, data.cep);
  }

  setEnderecoColeta(endereco: EnderecoVO): void {
    this.enderecoColeta = JSON.stringify({
      rua: endereco.rua,
      numero: endereco.numero,
      cidade: endereco.cidade,
      cep: endereco.cep
    });
  }

  getEnderecoEntrega(): EnderecoVO | null {
    if (!this.enderecoEntrega) return null;
    const data = JSON.parse(this.enderecoEntrega);
    return new EnderecoVO(data.rua, data.numero, data.cidade, data.cep);
  }

  setEnderecoEntrega(endereco: EnderecoVO): void {
    this.enderecoEntrega = JSON.stringify({
      rua: endereco.rua,
      numero: endereco.numero,
      cidade: endereco.cidade,
      cep: endereco.cep
    });
  }

  // Validação de status
  private validarStatus(novoStatus: StatusEntregaType): void {
    if (!isValidStatusEntrega(novoStatus)) {
      throw new Error(`Status inválido: ${novoStatus}`);
    }
  }
}
