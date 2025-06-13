import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('intent')
  criarIntent(@Body() intentDto: any) {
    return this.paymentService.criarIntent(intentDto);
  }

  @Post('webhook/stripe')
  webhookStripe(@Body() webhookDto: any) {
    return this.paymentService.webhookStripe(webhookDto);
  }
}
