import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
  criarIntent(intentDto: any) {
    // lógica para criar intent de pagamento
    return { ...intentDto, status: 'intent criada' };
  }
  webhookStripe(webhookDto: any) {
    // lógica para processar webhook do Stripe
    return { ...webhookDto, status: 'webhook recebido' };
  }
}
