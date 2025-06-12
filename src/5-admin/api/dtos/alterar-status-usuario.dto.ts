import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AlterarStatusUsuarioDto {
  @ApiProperty({
    description: 'Novo status do usuário',
    example: 'SUSPENSO',
    enum: ['ATIVO', 'INATIVO', 'SUSPENSO']
  })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({
    description: 'Motivo da alteração de status',
    example: 'Violação dos termos de uso'
  })
  @IsOptional()
  @IsString()
  motivo?: string;
}
