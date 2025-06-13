import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import Stripe from 'stripe';
import { Pedido } from '../../../2-sales/domain/entities/pedido.entity';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { StatusPagamento } from '../../domain/enums/status-pagamento.enum';
import { Dinheiro } from '../../domain/value-objects/dinheiro.value-object';
import { PagamentoRepository } from '../../infrastructure/repositories/pagamento.repository';
import { EventBusService, PedidoCriadoEvent, PagamentoProcessadoEvent } from '../../../common/event-bus';

/**
 * PaymentService - Camada de Aplicação
 * 
 * Responsabilidades:
 * - Orquestrar comunicação com o Stripe
 * - Processar webhooks de pagamento
 * - Coordenar operações de reembolso
 * - Gerenciar eventos de pagamento
 */
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
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  // ===================================
  // MÉTODOS PRINCIPAIS (CONFORME DIAGRAMA)
  // ===================================

  /**
   * Cria uma sessão de checkout do Stripe para o pedido
   * Implementação conforme diagrama de classes
   */
  async criarSessaoCheckoutStripe(pedido: Pedido): Promise<string> {
    try {
      // 1. Criar entidade Pagamento usando factory method
      const pagamento = Pagamento.criar(pedido.id, pedido.valorTotal);
      const pagamentoSalvo = await this.pagamentoRepository.criar(pagamento);

      // 2. Preparar dados para o Stripe
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = pedido.itens.map(item => ({
        price_data: {
          currency: 'brl',
          product_data: {
            name: item.nomeProduto,
            description: item.produto?.descricao || '',
          },
          unit_amount: Math.round(item.precoUnitario * 100), // Stripe espera centavos
        },
        quantity: item.quantidade,
      }));

      // 3. Configurar sessão do Stripe
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card', 'boleto'],
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

      // 4. Criar sessão no Stripe
      const session = await this.stripe.checkout.sessions.create(sessionParams);

      if (!session.url) {
        throw new Error('Falha ao criar sessão de checkout: URL não gerada');
      }

      // 5. Atualizar pagamento com dados do Stripe
      pagamentoSalvo.atualizarDadosGateway(session.id, undefined, undefined, session);
      await this.pagamentoRepository.atualizar(pagamentoSalvo);

      return session.url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao criar sessão de checkout: ${errorMessage}`);
    }
  }

  /**
   * Processa webhook do Stripe para atualizar status dos pagamentos
   * Implementação conforme diagrama de classes
   */
  async processarWebhookStripe(rawBody: Buffer, signature: string): Promise<void> {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET não configurada');
      }

      // 1. Verificar assinatura do webhook
      const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

      // 2. Processar eventos conforme tipo
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
          console.log(`Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na verificação do webhook';
      throw new Error(`Webhook signature verification failed: ${errorMessage}`);
    }
  }

  /**
   * Inicia processo de reembolso
   * Implementação conforme diagrama de classes
   */
  async iniciarReembolso(pedidoId: string, valor?: number): Promise<void> {
    try {
      // 1. Buscar pagamentos do pedido
      const pagamentos = await this.pagamentoRepository.findByPedidoId(pedidoId);
      const pagamentoAprovado = pagamentos.find(p => p.estaCompleto());

      if (!pagamentoAprovado) {
        throw new Error('Nenhum pagamento aprovado encontrado para este pedido');
      }

      if (!pagamentoAprovado.podeSerReembolsado()) {
        throw new Error('Pagamento não pode ser reembolsado');
      }

      // 2. Determinar valor do reembolso
      const valorReembolso = valor ? Dinheiro.criar(valor) : pagamentoAprovado.valor;

      // 3. Validar valor do reembolso
      if (valorReembolso.maiorQue(pagamentoAprovado.valor)) {
        throw new Error('Valor do reembolso não pode ser maior que o valor pago');
      }

      // 4. Criar reembolso no Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: pagamentoAprovado.stripePaymentIntentId,
        amount: valorReembolso.emCentavos(),
      });

      // 5. Atualizar status do pagamento
      if (valor && valor < pagamentoAprovado.valor.valor) {
        pagamentoAprovado.reembolsar(valorReembolso);
      } else {
        pagamentoAprovado.reembolsar();
      }

      await this.pagamentoRepository.atualizar(pagamentoAprovado);

      // 6. Emitir evento de reembolso
      await this.eventBusService.emitPagamentoProcessado({
        aggregateId: pagamentoAprovado.id,
        payload: {
          pedidoId: pagamentoAprovado.pedidoId,
          pagamentoId: pagamentoAprovado.id,
          status: 'estornado',
          valor: valorReembolso.valor,
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error('Erro ao processar reembolso: ' + errorMessage);
    }
  }

  // ===================================
  // HANDLERS PRIVADOS DE EVENTOS STRIPE
  // ===================================

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const pagamento = await this.pagamentoRepository.buscarPorStripeSessionId(session.id);
    
    if (!pagamento) {
      console.error(`Pagamento não encontrado para session: ${session.id}`);
      return;
    }

    // Atualizar dados do pagamento
    pagamento.atualizarDadosGateway(
      session.id,
      session.payment_intent as string,
      session.payment_method_types[0],
      session
    );
    
    await this.pagamentoRepository.atualizar(pagamento);
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const pagamento = await this.pagamentoRepository.buscarPorStripePaymentIntentId(paymentIntent.id);
    
    if (!pagamento) {
      console.error(`Pagamento não encontrado para payment_intent: ${paymentIntent.id}`);
      return;
    }

    // Confirmar pagamento usando método de domínio
    pagamento.confirmar();
    await this.pagamentoRepository.atualizar(pagamento);

    // Emitir evento de pagamento aprovado
    await this.eventBusService.emitPagamentoProcessado({
      aggregateId: pagamento.id,
      payload: {
        pedidoId: pagamento.pedidoId,
        pagamentoId: pagamento.id,
        status: 'aprovado',
        valor: pagamento.valor.valor,
      }
    });
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const pagamento = await this.pagamentoRepository.buscarPorStripePaymentIntentId(paymentIntent.id);
    
    if (!pagamento) {
      console.error(`Pagamento não encontrado para payment_intent: ${paymentIntent.id}`);
      return;
    }

    // Falhar pagamento usando método de domínio
    const motivo = paymentIntent.last_payment_error?.message || 'Falha no pagamento';
    pagamento.falhar(motivo);
    await this.pagamentoRepository.atualizar(pagamento);

    // Emitir evento de pagamento recusado
    await this.eventBusService.emitPagamentoProcessado({
      aggregateId: pagamento.id,
      payload: {
        pedidoId: pagamento.pedidoId,
        pagamentoId: pagamento.id,
        status: 'recusado',
        valor: pagamento.valor.valor,
      }
    });
  }

  private async handleChargeDispute(dispute: Stripe.Dispute): Promise<void> {
    // Buscar pagamento pela charge
    const charge = await this.stripe.charges.retrieve(dispute.charge as string);
    const pagamento = await this.pagamentoRepository.buscarPorStripePaymentIntentId(charge.payment_intent as string);
    
    if (!pagamento) {
      console.error(`Pagamento não encontrado para dispute: ${dispute.id}`);
      return;
    }

    // Reembolsar pagamento usando método de domínio
    pagamento.reembolsar();
    await this.pagamentoRepository.atualizar(pagamento);

    // Emitir evento de estorno
    await this.eventBusService.emitPagamentoProcessado({
      aggregateId: pagamento.id,
      payload: {
        pedidoId: pagamento.pedidoId,
        pagamentoId: pagamento.id,
        status: 'estornado',
        valor: pagamento.valor.valor,
      }
    });
  }

  // ===================================
  // MÉTODOS DE CONSULTA
  // ===================================

  async buscarStatusPagamento(pedidoId: string): Promise<Pagamento[]> {
    return this.pagamentoRepository.findByPedidoId(pedidoId);
  }

  async buscarPagamentoPorId(pagamentoId: string): Promise<Pagamento | null> {
    return this.pagamentoRepository.buscarPorId(pagamentoId);
  }

  // ===================================
  // EVENT HANDLERS
  // ===================================

  @OnEvent('pedido.criado')
  async handlePedidoCriado(event: PedidoCriadoEvent): Promise<void> {
    try {
      console.log('💳 Iniciando processo de pagamento para pedido:', {
        pedidoId: event.payload.pedidoId,
        valor: event.payload.valor,
        itens: event.payload.itens.length
      });

      // Criar registro de pagamento pendente usando factory method
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

    } catch (error) {
      console.error('Erro ao iniciar processo de pagamento:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      await this.eventBusService.emit({
        eventName: 'pagamento.erro_inicio',
        payload: {
          pedidoId: event.payload.pedidoId,
          erro: errorMessage
        },
        timestamp: new Date(),
        aggregateId: event.payload.pedidoId
      });
    }
  }
}
