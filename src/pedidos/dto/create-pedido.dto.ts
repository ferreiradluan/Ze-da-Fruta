import { IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PedidoItemDto {
  @IsNumber()
  produtoId!: number;

  @IsNumber()
  quantidade!: number;
}

export class CreatePedidoDto {
  @IsNumber()
  userId!: number;

  @IsNumber()
  enderecoId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  itens!: PedidoItemDto[];
}
