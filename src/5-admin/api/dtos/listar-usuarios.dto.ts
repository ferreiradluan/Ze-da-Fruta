import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListarUsuariosDto {
  @ApiPropertyOptional({
    description: 'Termo de busca para filtrar por nome, email ou CPF',
    example: 'joão silva'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status do usuário',
    example: 'ATIVO',
    enum: ['ATIVO', 'INATIVO', 'SUSPENSO', 'PENDENTE']
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por roles/perfis do usuário',
    example: ['CLIENTE', 'PARCEIRO'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : value ? [value] : undefined)
  roles?: string[];

  @ApiPropertyOptional({
    description: 'Número da página para paginação',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    example: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}
