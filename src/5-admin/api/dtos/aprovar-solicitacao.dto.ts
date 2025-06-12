import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class AprovarSolicitacaoDto {
  @ApiPropertyOptional({
    description: 'Observações sobre a aprovação',
    example: 'Solicitação aprovada após análise dos documentos',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;
}

export class RejeitarSolicitacaoDto {
  @ApiProperty({
    description: 'Motivo da rejeição',
    example: 'Documentos incompletos ou inválidos',
    maxLength: 500
  })
  @IsString()
  @MaxLength(500)
  motivo: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais sobre a rejeição',
    example: 'Solicitar envio de novos documentos',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;
}
