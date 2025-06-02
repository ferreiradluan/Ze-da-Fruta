import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('Stripe API key is not set. Defina STRIPE_API_KEY nas variáveis de ambiente.');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-05-28.basil', // Corrigido para a versão esperada pelo pacote stripe
    });
  }

  async createPaymentIntent(amount: number, currency: string) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
    });
    // Cria um registro local do pagamento vinculado ao PaymentIntent do Stripe
    // (Ajuste conforme sua lógica de pedido/pagamento)
    // await this.pagamentosService.create({
    //   valor: amount,
    //   status: 'PENDING',
    //   stripePaymentIntentId: paymentIntent.id,
    // });
    return paymentIntent;
  }
}
