import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class IniciarReembolsoDto {
  @ApiProperty({
    description: 'Motivo do reembolso',
    example: 'Produto com defeito reportado pelo cliente'
  })
  @IsString()
  @IsNotEmpty()
  motivo: string;
}
