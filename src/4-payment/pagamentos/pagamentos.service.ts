import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PagamentosService {
  private stripe: Stripe;
  private readonly logger = new Logger(PagamentosService.name);

  constructor(private eventEmitter: EventEmitter2) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createCheckoutSession(pedido: any): Promise<string> {
    // Formate os itens do pedido para o formato do Stripe
    interface PedidoItem {
        nome: string;
        preco: number;
        quantidade: number;
    }

    interface Pedido {
        id: string;
        itens: PedidoItem[];
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = (pedido as Pedido).itens.map((item: PedidoItem) => ({
        price_data: {
            currency: 'brl',
            product_data: {
                name: item.nome,
            },
            unit_amount: Math.round(item.preco * 100),
        },
        quantity: item.quantidade,
    }));
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: process.env.STRIPE_SUCCESS_URL!,
      cancel_url: process.env.STRIPE_CANCEL_URL!,
      metadata: {
        pedidoId: pedido.id,
      },
    });
    return session.url!;
  }

  async handleWebhookEvent(req: any, signature: string) {
    const buf = req.rawBody || req.body;
    let event;
    try {
      event = this.stripe.webhooks.constructEvent(
        buf,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      this.logger.error('Webhook signature verification failed.', err);
      throw err;
    }
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const pedidoId = session.metadata?.pedidoId;
        // Emite evento interno para o domínio de vendas
        this.eventEmitter.emit('pagamento.pago', { pedidoId });
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }
}
