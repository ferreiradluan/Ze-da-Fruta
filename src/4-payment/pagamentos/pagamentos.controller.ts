import { Controller, Post, Body, Headers, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import { Request, Response } from 'express';

@Controller('payment')
export class PagamentosController {
  constructor(private readonly pagamentosService: PagamentosService) {}

  @Post('checkout/create-session')
  async createCheckoutSession(@Body() pedido: any, @Res() res: Response) {
    try {
      const url = await this.pagamentosService.createCheckoutSession(pedido);
      return res.json({ url });
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException('Unknown error', HttpStatus.BAD_REQUEST);
      }
    }
  }

  @Post('webhook/stripe')
  async handleStripeWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'];
    if (typeof sig !== 'string') {
      res.status(400).send('Missing or invalid Stripe signature');
      return;
    }
    let event;
    try {
      await this.pagamentosService.handleWebhookEvent(req, sig);
      res.status(200).send('Webhook received');
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(`Webhook Error: ${err.message}`);
      } else {
        res.status(400).send('Webhook Error: Unknown error');
      }
    }
  }
}
