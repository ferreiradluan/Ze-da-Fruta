import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * ✅ FASE 4: DTO para item do checkout
 */
export class CheckoutItemDto {
  @ApiProperty({
    description: 'ID do produto',
    example: 'uuid-do-produto'
  })
  @IsUUID()
  @IsNotEmpty()
  produtoId!: string;

  @ApiProperty({
    description: 'Quantidade do produto',
    example: 2,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  quantidade!: number;
}

/**
 * ✅ FASE 4: DTO para checkout do carrinho
 */
export class CheckoutDto {
  @ApiProperty({
    description: 'Lista de itens do carrinho',
    type: [CheckoutItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  itens!: CheckoutItemDto[];

  @ApiPropertyOptional({
    description: 'Endereço de entrega (opcional)',
    example: 'Rua das Flores, 123'
  })
  @IsOptional()
  @IsString()
  enderecoEntrega?: string;

  @ApiPropertyOptional({
    description: 'Observações do pedido',
    example: 'Entregar no portão'
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

/**
 * ✅ FASE 4: DTO para aplicar cupom
 */
export class AplicarCupomDto {
  @ApiProperty({
    description: 'Código do cupom',
    example: 'DESCONTO10'
  })
  @IsString()
  @IsNotEmpty()
  codigo!: string;
}

/**
 * ✅ FASE 4: DTO para confirmar pedido
 */
export class ConfirmarPedidoDto {
  @ApiProperty({
    description: 'Endereço de entrega confirmado',
    example: 'Rua das Flores, 123, Centro, São Paulo, SP'
  })
  @IsString()
  @IsNotEmpty()
  endereco!: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Entregar no período da manhã'
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
