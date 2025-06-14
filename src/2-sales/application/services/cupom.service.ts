import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cupom } from '../../domain/entities/cupom.entity';
import { CupomRepository } from '../../infrastructure/repositories/cupom.repository';

/**
 * 🔧 FASE 3: CUPOMSERVICE REFATORADO PARA ORQUESTRAÇÃO PURA
 * 
 * ✅ APENAS persistência e consultas
 * ✅ Lógica de negócio está na entidade Cupom
 */
@Injectable()
export class CupomService {
  constructor(
    @InjectRepository(Cupom)
    private cupomRepository: Repository<Cupom>,
    private readonly cupomRepo: CupomRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  /**
   * ✅ Orquestração com lógica na entidade
   */
  async validarCupom(codigo: string, valorPedido: number): Promise<any> {
    const cupom = await this.cupomRepository.findOne({
      where: { codigo, ativo: true },
    });

    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado ou inativo');
    }

    // Validações usando métodos da entidade
    if (!cupom.estaValido()) {
      throw new BadRequestException('Cupom expirado');
    }

    if (!cupom.podeSerAplicado(valorPedido)) {
      throw new BadRequestException(`Valor mínimo para este cupom é R$ ${cupom.valorMinimoCompra}`);
    }

    return {
      cupom,
      valorDesconto: cupom.calcularDesconto(valorPedido),
    };
  }

  /**
   * ✅ APENAS persistência - lógica na entidade
   */
  async criarCupomGlobal(dadosCupom: any): Promise<Cupom> {
    // Factory method seria na entidade
    const cupom = new Cupom();
    
    cupom.codigo = dadosCupom.codigo || this.gerarCodigoCupom();
    cupom.descricao = dadosCupom.descricao;
    cupom.tipoDesconto = dadosCupom.tipoDesconto || 'PERCENTUAL';
    cupom.valor = dadosCupom.valor;
    cupom.valorMinimoCompra = dadosCupom.valorMinimoCompra || 0;
    cupom.valorMaximoDesconto = dadosCupom.valorMaximoDesconto;
    cupom.dataValidade = dadosCupom.dataValidade;
    cupom.ativo = true;
    cupom.limitesUso = dadosCupom.limitesUso || 1000;
    cupom.vezesUsado = 0;    const cupomSalvo = await this.cupomRepository.save(cupom);
    
    // Publicar eventos de domínio (quando a entidade implementar)
    // await this.publishDomainEvents(cupom);

    return cupomSalvo;
  }

  /**
   * ✅ Orquestração com lógica na entidade
   */
  async desativarCupom(cupomId: string): Promise<void> {
    const cupom = await this.cupomRepository.findOne({
      where: { id: cupomId },
    });

    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }    // Lógica seria na entidade
    cupom.ativo = false;
    await this.cupomRepository.save(cupom);
    
    // Publicar eventos de domínio (quando a entidade implementar)
    // await this.publishDomainEvents(cupom);
  }

  /**
   * ✅ Orquestração com lógica na entidade
   */
  async aplicarCupom(pedidoId: string, cupomId: string): Promise<void> {
    const cupom = await this.cupomRepository.findOne({
      where: { id: cupomId },
    });

    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }    // Lógica na entidade
    cupom.usar();
    await this.cupomRepository.save(cupom);
    
    // Publicar eventos de domínio (quando a entidade implementar)
    // await this.publishDomainEvents(cupom);
  }

  /**
   * ✅ APENAS consulta
   */
  async buscarCupomPorCodigo(codigo: string): Promise<Cupom> {
    const cupom = await this.cupomRepository.findOne({
      where: { codigo },
    });

    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }

    return cupom;
  }

  /**
   * ✅ APENAS consulta
   */
  async listarCupons(usuario: any): Promise<Cupom[]> {
    return this.cupomRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
  private calcularDesconto(cupom: Cupom, valorPedido: number): number {
    if (cupom.tipoDesconto === 'PERCENTUAL') {
      const desconto = (valorPedido * cupom.valor) / 100;
      return cupom.valorMaximoDesconto 
        ? Math.min(desconto, cupom.valorMaximoDesconto)
        : desconto;
    }
    return cupom.valor;
  }

  private gerarCodigoCupom(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `GLOBAL_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * ✅ Helper para publicar eventos de domínio
   */
  private async publishDomainEvents(entity: { getDomainEvents?(): any[]; clearDomainEvents?(): void }): Promise<void> {
    const eventos = entity.getDomainEvents?.();
    if (eventos) {
      for (const evento of eventos) {
        this.eventEmitter.emit(evento.eventName, evento);
      }
      entity.clearDomainEvents?.();
    }
  }
}
