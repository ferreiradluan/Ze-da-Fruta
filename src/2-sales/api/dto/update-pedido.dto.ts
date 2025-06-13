import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { StatusPedido } from '../../domain/enums/status-pedido.enum';

export class UpdatePedidoDto {
  @ApiPropertyOptional({
    description: 'Novo status do pedido',
    enum: StatusPedido,
    example: StatusPedido.EM_PREPARACAO
  })
  @IsOptional()
  @IsEnum(StatusPedido)
  status?: StatusPedido;

  @ApiPropertyOptional({
    description: 'Observações do pedido',
    example: 'Cliente solicitou entrega urgente'
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Endereço de entrega',
    example: 'Rua das Flores, 123 - Centro'
  })
  @IsOptional()
  @IsString()
  enderecoEntrega?: string;
}

export class UpdateItemPedidoDto {
  @ApiProperty({
    description: 'Nova quantidade do item',
    example: 3,
    minimum: 1
  })
  quantidade: number;
}

export class AdicionarItemDto {
  @ApiProperty({
    description: 'ID do produto a ser adicionado',
    example: 'uuid-do-produto'
  })
  @IsUUID()
  produtoId: string;

  @ApiProperty({
    description: 'Quantidade do produto',
    example: 2,
    minimum: 1
  })
  quantidade: number;
}

export class AplicarCupomDto {
  @ApiProperty({
    description: 'Código do cupom de desconto',
    example: 'DESCONTO10'
  })
  @IsString()
  codigo: string;
}
