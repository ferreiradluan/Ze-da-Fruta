import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested, ArrayMinSize, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemPedidoDto {
  @ApiProperty({
    description: 'ID do produto',
    example: 'uuid-do-produto'
  })
  @IsUUID()
  produtoId: string;
  @ApiProperty({
    description: 'Quantidade do produto',
    example: 2,
    minimum: 1
  })
  @IsNumber()
  @IsPositive()
  quantidade: number;
}

export class CreatePedidoDto {
  @ApiProperty({
    description: 'Lista de itens do pedido',
    type: [CreateItemPedidoDto]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Pedido deve ter pelo menos um item' })
  @ValidateNested({ each: true })
  @Type(() => CreateItemPedidoDto)
  itens: CreateItemPedidoDto[];

  @ApiPropertyOptional({
    description: 'Código do cupom de desconto',
    example: 'DESCONTO10'
  })
  @IsOptional()
  @IsString()
  cupomCodigo?: string;

  @ApiPropertyOptional({
    description: 'Observações do pedido',
    example: 'Entregar no portão dos fundos'
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Endereço de entrega específico (se diferente do padrão)',
    example: 'Rua das Flores, 123 - Centro'
  })
  @IsOptional()
  @IsString()
  enderecoEntrega?: string;
}
