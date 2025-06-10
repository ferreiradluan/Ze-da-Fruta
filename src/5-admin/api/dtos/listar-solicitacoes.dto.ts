import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { StatusSolicitacao } from '../../../1-account-management/domain/enums/status-solicitacao.enum';
import { TipoSolicitacao } from '../../../1-account-management/domain/enums/tipo-solicitacao.enum';

export class ListarSolicitacoesDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status da solicitação',
    enum: StatusSolicitacao,
    example: StatusSolicitacao.PENDENTE
  })
  @IsOptional()
  @IsEnum(StatusSolicitacao)
  status?: StatusSolicitacao;
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de solicitação',
    enum: TipoSolicitacao,
    example: TipoSolicitacao.LOJISTA
  })
  @IsOptional()
  @IsEnum(TipoSolicitacao)
  tipo?: TipoSolicitacao;

  @ApiPropertyOptional({
    description: 'Data de início para filtro por período (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  dataInicio?: Date;

  @ApiPropertyOptional({
    description: 'Data de fim para filtro por período (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  dataFim?: Date;

  @ApiPropertyOptional({
    description: 'Número da página para paginação',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

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
  limit?: number = 10;
}
