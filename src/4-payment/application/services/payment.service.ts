import { Injectable, Inject } from '@nestjs/common';
import { IPagamentoRepository } from '../../domain/repositories/pagamento.repository.interface';
import Stripe from 'stripe';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { Dinheiro } from '../../domain/value-objects/dinheiro.vo';

/**
 * 🔧 FASE 3: PAYMENTSERVICE REFATORADO PARA ORQUESTRAÇÃO PURA
 * 
 * ✅ APENAS persistência e consultas
 * ✅ Lógica de negócio está na entidade Pagamento
 * ✅ Usa factory methods e métodos da entidade
 * ✅ Integração real com Stripe
 */
@Injectable()
export class PaymentService {
  private stripe: Stripe;  constructor(
    @Inject('IPagamentoRepository')
    private readonly pagamentoRepository: IPagamentoRepository
  ) {
    // Inicializar Stripe com a chave secreta
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }

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
    try {
      // Mapear itens do pedido para formato do Stripe
      const lineItems = pedido.itens.map((item: any) => ({
        price_data: {
          currency: 'brl',
          product_data: {
            name: item.nome,
            description: item.descricao || `Produto: ${item.nome}`,
          },
          unit_amount: Math.round(item.preco * 100), // Stripe usa centavos
        },
        quantity: item.quantidade,
      }));

      // URLs de sucesso e cancelamento
      const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/cancel`;

      // Criar sessão no Stripe
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          pedidoId: pedido.id,
          clienteId: pedido.clienteId,
          enderecoEntrega: pedido.enderecoEntrega,
          observacoes: pedido.observacoes || '',
        },
        customer_email: pedido.emailCliente || undefined,
        billing_address_collection: 'required',        shipping_address_collection: {
          allowed_countries: ['BR'],
        },
        locale: 'pt-BR',
      });
      
      return session.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao criar sessão Stripe';
      throw new Error(`Erro ao criar sessão Stripe: ${message}`);
    }
  }

  private async validarWebhookStripe(payload: Buffer, signature: string): Promise<any> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET não configurado');
      }      // Validar assinatura do webhook
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      
      return event;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido no webhook';
      throw new Error(`Webhook inválido: ${message}`);
    }
  }

  private async processarReembolsoStripe(transacaoId: string, valor?: number): Promise<void> {
    try {
      const refundData: any = {
        payment_intent: transacaoId,
      };      // Se valor específico foi informado, usar parcial
      if (valor) {
        refundData.amount = Math.round(valor * 100); // Converter para centavos
      }
      
      await this.stripe.refunds.create(refundData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido no reembolso';
      throw new Error(`Erro ao processar reembolso: ${message}`);
    }
  }
}
