import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  UseGuards, 
  Query,
  Headers,
  RawBodyRequest,
  Req,
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiBody, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { PaymentService } from '../../application/services/payment.service';
import { Request } from 'express';

@ApiTags('💳 Pagamento')
@Controller('payment')
export class PaymentController {

  constructor(private paymentService: PaymentService) {}

  @Post('process')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Processar pagamento',
    description: 'Processa o pagamento de um pedido utilizando diferentes métodos de pagamento'
  })
  @ApiBody({
    description: 'Dados do pagamento',
    schema: {
      type: 'object',
      properties: {
        pedidoId: {
          type: 'string',
          example: 'uuid-pedido-123',
          description: 'ID do pedido a ser pago'
        },
        metodoPagamento: {
          type: 'string',
          enum: ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'MONEY'],
          example: 'PIX',
          description: 'Método de pagamento escolhido'
        },
        dadosCartao: {
          type: 'object',
          properties: {
            numero: { type: 'string', example: '1234567890123456' },
            nomeTitular: { type: 'string', example: 'João Silva' },
            validade: { type: 'string', example: '12/28' },
            cvv: { type: 'string', example: '123' }
          },
          description: 'Dados do cartão (obrigatório para pagamento com cartão)'
        },
        valor: {
          type: 'number',
          example: 45.90,
          description: 'Valor total do pagamento'
        }
      },
      required: ['pedidoId', 'metodoPagamento', 'valor']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Pagamento processado com sucesso',
    schema: {
      type: 'object',
      properties: {
        transacaoId: {
          type: 'string',
          example: 'txn-uuid-123',
          description: 'ID da transação'
        },
        status: {
          type: 'string',
          enum: ['APPROVED', 'PENDING', 'REJECTED'],
          example: 'APPROVED',
          description: 'Status do pagamento'
        },
        metodoPagamento: {
          type: 'string',
          example: 'PIX'
        },
        valor: {
          type: 'number',
          example: 45.90
        },
        codigoPix: {
          type: 'string',
          example: '00020126360014BR.GOV.BCB.PIX...',
          description: 'Código PIX (apenas para pagamento PIX)'
        },
        qrCode: {
          type: 'string',
          example: 'data:image/png;base64,iVBORw0KGgo...',
          description: 'QR Code PIX (apenas para pagamento PIX)'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de pagamento inválidos'
  })
  @ApiResponse({
    status: 402,
    description: 'Pagamento rejeitado'
  })  async processPayment(@Body() paymentData: any) {
    // TODO: Implementar processamento de pagamento
    return {
      message: 'Endpoint de processamento de pagamento não implementado ainda',
      data: paymentData
    };
  }

  @Post('webhook/stripe')
  @Public()
  @ApiOperation({
    summary: 'Webhook do Stripe',
    description: 'Endpoint exclusivo para receber notificações do Stripe sobre mudanças de status de pagamentos. Este endpoint é publico e a segurança é feita via validação de assinatura.'
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook do Stripe processado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Assinatura inválida ou erro no processamento'
  })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    try {
      if (!req.rawBody) {
        throw new BadRequestException('Corpo da requisição não encontrado');
      }
      
      if (!signature) {
        throw new BadRequestException('Assinatura do webhook não encontrada');
      }

      await this.paymentService.processarWebhookStripe(req.rawBody, signature);
      
      return { message: 'Webhook do Stripe processado com sucesso' };
    } catch (error) {
      console.error('Erro ao processar webhook do Stripe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar webhook';
      throw new BadRequestException(errorMessage);
    }
  }

  @Get('status/:transacaoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consultar status do pagamento',
    description: 'Consulta o status atual de uma transação de pagamento'
  })
  @ApiParam({
    name: 'transacaoId',
    description: 'ID da transação de pagamento',
    example: 'txn-uuid-123'
  })
  @ApiResponse({
    status: 200,
    description: 'Status do pagamento retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        transacaoId: { type: 'string', example: 'txn-uuid-123' },
        status: { 
          type: 'string', 
          enum: ['APPROVED', 'PENDING', 'REJECTED', 'CANCELLED'],
          example: 'APPROVED' 
        },
        valor: { type: 'number', example: 45.90 },
        metodoPagamento: { type: 'string', example: 'PIX' },
        dataProcessamento: {
          type: 'string',
          format: 'date-time',
          example: '2025-06-07T14:30:00Z'
        },
        pedidoId: { type: 'string', example: 'uuid-pedido-123' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Transação não encontrada'
  })  async getPaymentStatus(@Param('transacaoId') transacaoId: string) {
    try {
      const pagamento = await this.paymentService.buscarPagamentoPorId(transacaoId);
      
      if (!pagamento) {
        return {
          message: 'Pagamento não encontrado',
          transacaoId
        };
      }

      return {
        transacaoId: pagamento.id,
        status: pagamento.status,
        valor: pagamento.valor,
        metodoPagamento: pagamento.metodoPagamento,
        dataProcessamento: pagamento.dataProcessamento,
        pedidoId: pagamento.pedidoId
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        message: 'Erro ao consultar status do pagamento',
        error: errorMessage,
        transacaoId
      };
    }
  }

  @Get('pedido/:pedidoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consultar pagamentos de um pedido',
    description: 'Retorna todos os pagamentos associados a um pedido específico'
  })
  @ApiParam({
    name: 'pedidoId',
    description: 'ID do pedido',
    example: 'uuid-pedido-123'
  })
  @ApiResponse({
    status: 200,
    description: 'Pagamentos do pedido retornados com sucesso',
    schema: {
      type: 'object',
      properties: {
        pedidoId: { type: 'string', example: 'uuid-pedido-123' },
        pagamentos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-pagamento-123' },
              status: { type: 'string', example: 'APROVADO' },
              valor: { type: 'number', example: 45.90 },
              metodoPagamento: { type: 'string', example: 'card' },
              dataProcessamento: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  async getPaymentsByPedido(@Param('pedidoId') pedidoId: string) {
    try {
      const pagamentos = await this.paymentService.buscarStatusPagamento(pedidoId);
      
      return {
        pedidoId,
        pagamentos: pagamentos.map(p => ({
          id: p.id,
          status: p.status,
          valor: p.valor,
          metodoPagamento: p.metodoPagamento,
          dataProcessamento: p.dataProcessamento,
          createdAt: p.createdAt
        }))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        message: 'Erro ao consultar pagamentos do pedido',
        error: errorMessage,
        pedidoId
      };
    }
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook de notificação de pagamento',
    description: 'Endpoint para receber notificações de mudança de status dos gateways de pagamento'
  })
  @ApiBody({
    description: 'Dados da notificação do gateway',
    schema: {
      type: 'object',
      properties: {
        transacaoId: { type: 'string', example: 'txn-uuid-123' },
        status: { type: 'string', example: 'APPROVED' },
        gatewayId: { type: 'string', example: 'stripe_123' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso'
  })  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    try {
      if (!req.rawBody) {
        throw new Error('Corpo da requisição não encontrado');
      }
      
      if (!signature) {
        throw new Error('Assinatura do webhook não encontrada');
      }

      await this.paymentService.processarWebhookStripe(req.rawBody, signature);
      return { message: 'Webhook processado com sucesso' };
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { 
        message: 'Erro ao processar webhook', 
        error: errorMessage 
      };
    }
  }

  @Get('methods')
  @ApiOperation({
    summary: 'Listar métodos de pagamento disponíveis',
    description: 'Retorna lista de métodos de pagamento aceitos pela plataforma'
  })
  @ApiResponse({
    status: 200,
    description: 'Métodos de pagamento retornados com sucesso',
    schema: {
      type: 'object',
      properties: {
        metodos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              codigo: { type: 'string', example: 'PIX' },
              nome: { type: 'string', example: 'PIX' },
              descricao: { type: 'string', example: 'Pagamento instantâneo' },
              taxas: { type: 'number', example: 0 },
              ativo: { type: 'boolean', example: true }
            }
          }
        }
      }
    }
  })
  async getPaymentMethods() {
    // TODO: Implementar listagem de métodos
    return {
      message: 'Endpoint de métodos de pagamento não implementado ainda',
      metodos: [
        { codigo: 'PIX', nome: 'PIX', descricao: 'Pagamento instantâneo', taxas: 0, ativo: true },
        { codigo: 'CREDIT_CARD', nome: 'Cartão de Crédito', descricao: 'Pagamento com cartão', taxas: 3.5, ativo: true }
      ]
    };
  }

  @Put('cancel/:transacaoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancelar pagamento',
    description: 'Cancela uma transação de pagamento pendente'
  })
  @ApiParam({
    name: 'transacaoId',
    description: 'ID da transação a ser cancelada',
    example: 'txn-uuid-123'
  })
  @ApiResponse({
    status: 200,
    description: 'Pagamento cancelado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Pagamento não pode ser cancelado (já processado)'
  })
  async cancelPayment(@Param('transacaoId') transacaoId: string) {
    // TODO: Implementar cancelamento de pagamento
    return {
      message: 'Endpoint de cancelamento não implementado ainda',
      transacaoId
    };
  }

  @Post('refund/:transacaoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Solicitar estorno',
    description: 'Solicita estorno total ou parcial de um pagamento aprovado'
  })
  @ApiParam({
    name: 'transacaoId',
    description: 'ID da transação para estorno',
    example: 'txn-uuid-123'
  })
  @ApiBody({
    description: 'Dados do estorno',
    schema: {
      type: 'object',
      properties: {
        valor: {
          type: 'number',
          example: 45.90,
          description: 'Valor do estorno (omitir para estorno total)'
        },
        motivo: {
          type: 'string',
          example: 'Produto não entregue',
          description: 'Motivo do estorno'
        }
      },
      required: ['motivo']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Estorno solicitado com sucesso',
    schema: {
      type: 'object',
      properties: {
        estornoId: { type: 'string', example: 'ref-uuid-123' },
        status: { type: 'string', example: 'PENDING' },
        valor: { type: 'number', example: 45.90 }
      }
    }
  })
  async requestRefund(@Param('transacaoId') transacaoId: string, @Body() refundData: any) {
    // TODO: Implementar solicitação de estorno
    return {
      message: 'Endpoint de estorno não implementado ainda',
      transacaoId,
      data: refundData
    };
  }
}
