import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoriaDto {
  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Frutas',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({
    description: 'Descrição da categoria',
    example: 'Frutas frescas e saborosas',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Status de ativação da categoria',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean = true;
}
