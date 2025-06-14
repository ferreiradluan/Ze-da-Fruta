import { Injectable, Inject } from '@nestjs/common';
import { IPagamentoRepository } from '../../domain/repositories/pagamento.repository.interface';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { Dinheiro } from '../../domain/value-objects/dinheiro.vo';

/**
 * 🔧 FASE 3: PAYMENTSERVICE REFATORADO PARA ORQUESTRAÇÃO PURA
 * 
 * ✅ APENAS persistência e consultas
 * ✅ Lógica de negócio está na entidade Pagamento
 * ✅ Usa factory methods e métodos da entidade
 */
@Injectable()
export class PaymentService {
  constructor(
    @Inject('IPagamentoRepository')
    private readonly pagamentoRepository: IPagamentoRepository
  ) {}

  // ✅ Método 1: criarSessaoCheckoutStripe
  async criarSessaoCheckoutStripe(pedido: any): Promise<string> {
    // Lógica de criação da sessão Stripe
    const sessionId = await this.criarSessaoStripe(pedido);
    
    // Criar entidade de pagamento
    const pagamento = Pagamento.criar({
      pedidoId: pedido.id,
      valor: new Dinheiro(pedido.valorTotal),
      provedor: 'stripe',
      idTransacaoExterna: sessionId
    });

    await this.pagamentoRepository.save(pagamento);
    return sessionId;
  }

  // ✅ Método 2: processarWebhookStripe
  async processarWebhookStripe(payload: Buffer, signature: string): Promise<void> {
    const evento = await this.validarWebhookStripe(payload, signature);
    
    const pagamento = await this.pagamentoRepository.findByTransacaoExternaId(
      evento.data.object.id
    );

    if (!pagamento) {
      throw new Error('Pagamento não encontrado para o webhook');
    }

    switch (evento.type) {
      case 'payment_intent.succeeded':
        pagamento.confirmar();
        break;
      case 'payment_intent.payment_failed':
        pagamento.falhar('Falha no processamento');
        break;
    }

    await this.pagamentoRepository.save(pagamento);
  }
  // ✅ Método 3: iniciarReembolso
  async iniciarReembolso(pedidoId: string, valor?: number): Promise<void> {
    const pagamento = await this.pagamentoRepository.findByPedidoId(pedidoId);
    
    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }

    const valorReembolso = valor ? new Dinheiro(valor) : undefined;
    pagamento.reembolsar(valorReembolso);

    // Processar reembolso no Stripe
    if (pagamento.idTransacaoExterna) {
      await this.processarReembolsoStripe(pagamento.idTransacaoExterna, valor);
    }
    
    await this.pagamentoRepository.save(pagamento);
  }

  // ===================================
  // MÉTODOS PRIVADOS (Implementação)
  // ===================================
  private async criarSessaoStripe(pedido: any): Promise<string> {
    // Implementação específica do Stripe
    return 'cs_test_session_id';
  }

  private async validarWebhookStripe(payload: Buffer, signature: string): Promise<any> {
    // Implementação específica do Stripe
    return { type: 'payment_intent.succeeded', data: { object: { id: 'pi_test' } } };
  }

  private async processarReembolsoStripe(transacaoId: string, valor?: number): Promise<void> {
    // Implementação específica do Stripe
  }
}
