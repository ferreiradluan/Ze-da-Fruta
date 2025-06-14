import { ApiProperty } from '@nestjs/swagger';
import { StatusPedido } from '../../../domain/enums/status-pedido.enum';

/**
 * ✅ FASE 4: Response DTO para Cupom
 */
export class CupomResponseDto {
  @ApiProperty({
    description: 'Código do cupom',
    example: 'DESCONTO10'
  })
  codigo!: string;

  @ApiProperty({
    description: 'Valor do desconto',
    example: 3.00
  })
  valorDesconto!: number;

  @ApiProperty({
    description: 'Tipo de desconto',
    example: 'PERCENTUAL'
  })
  tipoDesconto!: string;
}

/**
 * ✅ FASE 4: Response DTO para Item de Pedido
 */
export class ItemPedidoResponseDto {
  @ApiProperty({
    description: 'ID do item',
    example: 'uuid-do-item'
  })
  id!: string;

  @ApiProperty({
    description: 'ID do produto',
    example: 'uuid-do-produto'
  })
  produtoId!: string;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Maçã Vermelha'
  })
  nomeProduto!: string;

  @ApiProperty({
    description: 'Quantidade do produto',
    example: 2
  })
  quantidade!: number;

  @ApiProperty({
    description: 'Preço unitário',
    example: 4.50
  })
  precoUnitario!: number;

  @ApiProperty({
    description: 'Subtotal do item',
    example: 9.00
  })
  subtotal!: number;
}

/**
 * ✅ FASE 4: Response DTO para expor apenas dados necessários de Pedido
 */
export class PedidoResponseDto {
  @ApiProperty({
    description: 'ID único do pedido',
    example: 'uuid-do-pedido'
  })
  id!: string;

  @ApiProperty({
    description: 'Status atual do pedido',
    enum: StatusPedido,
    example: StatusPedido.PAGAMENTO_PENDENTE
  })
  status!: StatusPedido;

  @ApiProperty({
    description: 'Valor total do pedido',
    example: 45.90
  })
  valorTotal!: number;

  @ApiProperty({
    description: 'Valor subtotal (sem descontos)',
    example: 48.90
  })
  valorSubtotal!: number;

  @ApiProperty({
    description: 'Valor do desconto aplicado',
    example: 3.00
  })
  valorDesconto!: number;

  @ApiProperty({
    description: 'Data de criação do pedido',
    example: '2024-01-15T10:30:00Z'
  })
  criadoEm!: Date;

  @ApiProperty({
    description: 'Endereço de entrega',
    example: 'Rua das Flores, 123 - Centro, São Paulo/SP',
    required: false
  })
  enderecoEntrega?: string;

  @ApiProperty({
    description: 'Observações do pedido',
    example: 'Entregar no portão dos fundos',
    required: false
  })
  observacoes?: string;

  @ApiProperty({
    description: 'Itens do pedido',
    type: [ItemPedidoResponseDto]
  })
  itens!: ItemPedidoResponseDto[];

  @ApiProperty({
    description: 'Cupom aplicado',
    type: CupomResponseDto,
    required: false
  })
  cupom?: CupomResponseDto;
}
