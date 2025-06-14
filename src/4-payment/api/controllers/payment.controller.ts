import { Controller, Post, Req, Res, Headers } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentService } from '../../application/services/payment.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ✅ ÚNICO método especificado no diagrama
  @Post('webhook/stripe')
  @Public()
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string
  ): Promise<void> {
    try {
      await this.paymentService.processarWebhookStripe(
        req.body,
        signature
      );
      res.status(200).json({ received: true });    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(400).json({ error: message });
    }
  }
}
