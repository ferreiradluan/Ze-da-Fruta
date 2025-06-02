import { Controller, Get, Post, Put, Delete, Param, Body, Headers, Req, Res } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import { Pagamento } from '../common/entities/pagamento.entity';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';
import Stripe from 'stripe';

@Controller('pagamentos')
export class PagamentosController {
  constructor(
    private readonly pagamentosService: PagamentosService,
    private readonly stripeService: StripeService,
  ) {}

  @Post()
  create(@Body() pagamento: Pagamento): Promise<Pagamento> {
    return this.pagamentosService.create(pagamento);
  }

  @Get()
  findAll(): Promise<Pagamento[]> {
    return this.pagamentosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Pagamento | null> {
    return this.pagamentosService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() pagamento: Partial<Pagamento>): Promise<Pagamento | null> {
    return this.pagamentosService.update(id, pagamento);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<boolean> {
    return this.pagamentosService.remove(id);
  }

  @Post('intent')
  async createPaymentIntent(@Body() body: { valor: number; moeda: string }) {
    // valor em centavos (ex: 10,00 BRL = 1000)
    const paymentIntent = await this.stripeService.createPaymentIntent(body.valor, body.moeda);
    return { client_secret: paymentIntent.client_secret };
  }

  @Post('webhook')
  async handleStripeWebhook(@Req() req: Request, @Res() res: Response, @Headers('stripe-signature') sig: string) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-05-28.basil', // Corrigido para a versão esperada pelo pacote stripe
    });
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }
    // Trate eventos relevantes
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Atualize o status do pagamento no banco de dados
      await this.pagamentosService.updateStatusByStripeId(paymentIntent.id, 'SUCCEEDED');
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.pagamentosService.updateStatusByStripeId(paymentIntent.id, 'FAILED');
    }
    res.status(200).json({ received: true });
  }
}