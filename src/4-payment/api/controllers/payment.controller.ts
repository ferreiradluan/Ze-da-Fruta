import { Controller, Post, Req, Res, Headers, Body, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentService } from '../../application/services/payment.service';
import { Public } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('💳 Payment - Pagamentos e Stripe')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * 🛒 POST /payment/create-checkout-session - Criar sessão de checkout Stripe
   */
  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Criar sessão de checkout Stripe',
    description: 'Cria uma sessão de checkout no Stripe para processar pagamento de produtos'
  })
  @ApiBody({
    description: 'Dados do pedido para checkout',
    schema: {
      type: 'object',
      properties: {
        itens: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              produtoId: { type: 'string', example: 'uuid-produto-123' },
              nome: { type: 'string', example: 'Maçã Gala' },
              preco: { type: 'number', example: 5.99 },
              quantidade: { type: 'number', example: 2 }
            }
          }
        },
        enderecoEntrega: { type: 'string', example: 'Rua Teste, 123 - Centro - São Paulo/SP' },
        observacoes: { type: 'string', example: 'Entregar no portão' },
        metodoPagamento: { type: 'string', example: 'STRIPE_CHECKOUT' }
      },
      required: ['itens']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Sessão de checkout criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'cs_test_123...' },
        checkoutUrl: { type: 'string', example: 'https://checkout.stripe.com/pay/cs_test_123...' },
        message: { type: 'string', example: 'Sessão de checkout criada com sucesso' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou carrinho vazio'
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido'
  })
  async createCheckoutSession(@Req() req: any, @Body() dadosCheckout: any) {
    try {
      // Validar dados básicos
      if (!dadosCheckout.itens || !Array.isArray(dadosCheckout.itens) || dadosCheckout.itens.length === 0) {
        return {
          error: 'Carrinho vazio',
          message: 'Adicione itens ao carrinho antes de finalizar a compra',
          status: 400
        };
      }

      // Calcular valor total
      const valorTotal = dadosCheckout.itens.reduce((total: number, item: any) => {
        return total + (item.preco * item.quantidade);
      }, 0);

      // Montar objeto de pedido para o PaymentService
      const pedido = {
        id: `pedido-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clienteId: req.user.id,
        valorTotal,
        itens: dadosCheckout.itens,
        enderecoEntrega: dadosCheckout.enderecoEntrega || 'Endereço não informado',
        observacoes: dadosCheckout.observacoes || '',
        metodoPagamento: dadosCheckout.metodoPagamento || 'STRIPE_CHECKOUT'
      };

      // Criar sessão no Stripe através do PaymentService
      const sessionId = await this.paymentService.criarSessaoCheckoutStripe(pedido);

      // Gerar URL do checkout
      const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;

      return {
        sessionId,
        checkoutUrl,
        message: 'Sessão de checkout criada com sucesso',
        pedido: {
          id: pedido.id,
          valorTotal: valorTotal.toFixed(2),
          quantidadeItens: dadosCheckout.itens.length
        }
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao criar checkout';
      return {
        error: 'Erro interno',
        message,
        status: 500
      };
    }
  }
  // ✅ ÚNICO método especificado no diagrama
  @Post('webhook/stripe')
  @Public()
  @ApiOperation({
    summary: 'Webhook do Stripe',
    description: 'Processa webhooks enviados pelo Stripe para confirmar pagamentos'
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso'  })
  @ApiResponse({
    status: 400,
    description: 'Assinatura inválida ou erro no processamento'
  })
  async handleStripeWebhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
    try {
      // Obter o payload bruto do request
      const payload = req.body;
      
      if (!signature) {
        return {
          error: 'Assinatura ausente',
          message: 'Header stripe-signature é obrigatório',
          status: 400
        };
      }

      // Processar webhook através do PaymentService
      await this.paymentService.processarWebhookStripe(payload, signature);

      return {
        message: 'Webhook processado com sucesso',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido no webhook';
      return {
        error: 'Erro no processamento',
        message,
        status: 400
      };
    }
  }
}
