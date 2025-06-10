import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import Stripe from 'stripe';
import { Pedido } from '../../../2-sales/domain/entities/pedido.entity';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { StatusPagamento } from '../../domain/enums/status-pagamento.enum';
import { PagamentoRepository } from '../../infrastructure/repositories/pagamento.repository';
import { EventBusService, PedidoCriadoEvent, PagamentoProcessadoEvent } from '../../../common/event-bus';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private pagamentoRepository: PagamentoRepository,
    private eventBusService: EventBusService
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada');
    }    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  /**
   * Cria uma sessão de checkout do Stripe para o pedido
   * Implementação completa conforme Passo 4 da Fase 3
   * @param pedido - Pedido para criar a sessão de checkout
   * @returns URL da sessão de checkout
   */
  async criarSessaoCheckoutStripe(pedido: Pedido): Promise<string> {
    try {
      // 1. Criar e salvar entidade Pagamento no banco
      const pagamento = Pagamento.criar(pedido.id, pedido.valorTotal);
      const pagamentoSalvo = await this.pagamentoRepository.criar(pagamento);

      // 2. Comunicação com o Gateway Stripe - Formatar dados
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = pedido.itens.map(item => ({
        price_data: {
          currency: 'brl',
          product_data: {
            name: item.nomeProduto,
            description: item.produto?.descricao || '',
            images: item.imagemProduto ? [item.imagemProduto] : [],
          },
          unit_amount: Math.round(item.precoUnitario * 100), // Stripe expects cents
        },
        quantity: item.quantidade,
      }));

      // Criar sessão de checkout
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/pedido/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/pedido/cancelado?pedido_id=${pedido.id}`,
        metadata: {
          pedidoId: pedido.id,
          pagamentoId: pagamentoSalvo.id,
          clienteId: pedido.clienteId,
        },
        shipping_address_collection: {
          allowed_countries: ['BR'],
        },
      };

      // Adicionar desconto se houver cupom aplicado
      if (pedido.cupom && pedido.valorDesconto > 0) {
        const stripeCoupon = await this.stripe.coupons.create({
          amount_off: Math.round(pedido.valorDesconto * 100), // Stripe expects cents
          currency: 'brl',
          duration: 'once',
          name: `Cupom ${pedido.cupom.codigo}`,
        });
        sessionParams.discounts = [{ coupon: stripeCoupon.id }];
      }

      // 3. Chamar API do Stripe
      const session = await this.stripe.checkout.sessions.create(sessionParams);

      if (!session.url) {
        throw new Error('Falha ao criar sessão de checkout: URL não gerada');
      }

      // Atualizar pagamento com dados do Stripe
      pagamentoSalvo.stripeSessionId = session.id;
      await this.pagamentoRepository.atualizar(pagamentoSalvo);

      // 4. Retornar checkoutUrl
      return session.url;
    } catch (error) {
      // 3. Tratamento de Exceção
      throw new Error(`Erro ao criar sessão de checkout: ${error.message}`);
    }
  }

  /**
   * Processa webhook do Stripe para atualizar status dos pagamentos
   * @param rawBody - Corpo da requisição raw do Stripe
   * @param signature - Assinatura do webhook
   */
  async processarWebhookStripe(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET não configurada');
    }

    let event: Stripe.Event;

    try {
      // Verificar assinatura do webhook
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }

    // Processar eventos do Stripe
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'charge.dispute.created':
        await this.handleChargeDispute(event.data.object as Stripe.Dispute);
        break;
      
      default:
        console.log(`Tipo de evento não tratado: ${event.type}`);
    }
  }

  /**
   * Trata o evento de checkout concluído
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const pagamento = await this.pagamentoRepository.buscarPorStripeSessionId(session.id);
    
    if (!pagamento) {
      console.error(`Pagamento não encontrado para session: ${session.id}`);
      return;
    }

    // Atualizar dados do pagamento
    pagamento.stripePaymentIntentId = session.payment_intent as string;
    pagamento.metodoPagamento = session.payment_method_types[0];
    pagamento.gatewayResponse = JSON.stringify(session);
    
    await this.pagamentoRepository.atualizar(pagamento);
  }

  /**
   * Trata o evento de pagamento bem-sucedido
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const pagamento = await this.pagamentoRepository.buscarPorStripePaymentIntentId(paymentIntent.id);
    
    if (!pagamento) {
      console.error(`Pagamento não encontrado para payment_intent: ${paymentIntent.id}`);
      return;
    }    // Aprovar pagamento
    pagamento.aprovar();
    await this.pagamentoRepository.atualizar(pagamento);

    // Publicar evento de pagamento aprovado
    await this.eventBusService.emitPagamentoProcessado({
      aggregateId: pagamento.id,
      payload: {
        pedidoId: pagamento.pedidoId,
        pagamentoId: pagamento.id,
        status: 'aprovado',
        valor: pagamento.valor,
      }
    });
  }

  /**
   * Trata o evento de falha no pagamento
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const pagamento = await this.pagamentoRepository.buscarPorStripePaymentIntentId(paymentIntent.id);
    
    if (!pagamento) {
      console.error(`Pagamento não encontrado para payment_intent: ${paymentIntent.id}`);
      return;
    }    // Recusar pagamento
    const motivo = paymentIntent.last_payment_error?.message || 'Falha no processamento';
    pagamento.recusar(motivo);
    await this.pagamentoRepository.atualizar(pagamento);

    // Publicar evento de pagamento recusado
    await this.eventBusService.emitPagamentoProcessado({
      aggregateId: pagamento.id,
      payload: {
        pedidoId: pagamento.pedidoId,
        pagamentoId: pagamento.id,
        status: 'recusado',
        valor: pagamento.valor,
      }
    });
  }

  /**
   * Trata eventos de disputa/estorno
   */
  private async handleChargeDispute(dispute: Stripe.Dispute): Promise<void> {
    // Buscar pagamento pela charge
    const charge = await this.stripe.charges.retrieve(dispute.charge as string);
    const pagamento = await this.pagamentoRepository.buscarPorStripePaymentIntentId(charge.payment_intent as string);
    
    if (!pagamento) {
      console.error(`Pagamento não encontrado para dispute: ${dispute.id}`);
      return;
    }    // Marcar como estornado
    pagamento.estornar();
    await this.pagamentoRepository.atualizar(pagamento);

    // Publicar evento de estorno
    await this.eventBusService.emitPagamentoProcessado({
      aggregateId: pagamento.id,
      payload: {
        pedidoId: pagamento.pedidoId,
        pagamentoId: pagamento.id,
        status: 'estornado',
        valor: pagamento.valor,
      }
    });
  }

  /**
   * Busca status de um pagamento
   */
  async buscarStatusPagamento(pedidoId: string): Promise<Pagamento[]> {
    return this.pagamentoRepository.buscarPorPedidoId(pedidoId);
  }

  /**
   * Busca pagamento por ID
   */  async buscarPagamentoPorId(pagamentoId: string): Promise<Pagamento | null> {
    return this.pagamentoRepository.buscarPorId(pagamentoId);
  }

  // ===== EVENT HANDLERS REAIS =====

  /**
   * Handler REAL: Inicia processo de pagamento quando pedido é criado
   */
  @OnEvent('pedido.criado')
  async handlePedidoCriado(event: PedidoCriadoEvent): Promise<void> {
    try {
      console.log('💳 Iniciando processo de pagamento para pedido:', {
        pedidoId: event.payload.pedidoId,
        valor: event.payload.valor,
        itens: event.payload.itens.length
      });      // Criar registro de pagamento pendente
      const pagamento = Pagamento.criar(
        event.payload.pedidoId,
        event.payload.valor
      );

      const pagamentoSalvo = await this.pagamentoRepository.criar(pagamento);

      console.log(`💰 Pagamento ${pagamentoSalvo.id} criado para pedido ${event.payload.pedidoId}`);

      // Emitir evento de pagamento iniciado
      await this.eventBusService.emit({
        eventName: 'pagamento.iniciado',
        payload: {
          pagamentoId: pagamentoSalvo.id,
          pedidoId: event.payload.pedidoId,
          valor: event.payload.valor,
          status: 'PENDENTE'
        },
        timestamp: new Date(),
        aggregateId: pagamentoSalvo.id
      });

      // Em uma implementação real, você poderia:
      // 1. Pré-autorizar o cartão
      // 2. Criar sessão de checkout automaticamente
      // 3. Enviar link de pagamento por email/SMS
      // 4. Integrar com gateway de pagamento PIX

    } catch (error) {
      console.error('Erro ao iniciar processo de pagamento:', error);
      
      // Emitir evento de erro no pagamento
      await this.eventBusService.emit({
        eventName: 'pagamento.erro_inicio',
        payload: {
          pedidoId: event.payload.pedidoId,
          erro: error.message
        },
        timestamp: new Date(),
        aggregateId: event.payload.pedidoId
      });
    }
  }

  /**
   * Cria um reembolso via Stripe
   */
  async criarReembolso(valor: number, motivo: string): Promise<any> {
    try {
      // TODO: Implementar integração real com Stripe
      // Por enquanto, simular reembolso
      const reembolsoId = `reemb_${Date.now()}`;
      
      console.log(`Simulando reembolso de R$ ${valor.toFixed(2)} - Motivo: ${motivo}`);
      
      // Em uma implementação real, seria algo como:
      // const refund = await this.stripe.refunds.create({
      //   charge: chargeId,
      //   amount: Math.round(valor * 100),
      //   reason: 'requested_by_customer',
      //   metadata: { motivo }
      // });

      return {
        id: reembolsoId,
        valor: valor,
        status: 'succeeded',
        motivo: motivo,
        criadoEm: new Date(),
        processadoEm: new Date()
      };
    } catch (err) {
      console.error('Erro ao criar reembolso', err);
      throw new Error('Erro ao processar reembolso: ' + (err?.message || err));
    }
  }
}
