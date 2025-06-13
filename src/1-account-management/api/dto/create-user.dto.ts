import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva'
  })
  @IsString()
  nome!: string;

  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'joao.silva@email.com'
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Status do usuário',
    example: 'ATIVO',
    enum: ['ATIVO', 'INATIVO', 'SUSPENSO'],
    default: 'ATIVO'
  })
  @IsOptional()
  @IsString()
  status?: string = 'ATIVO';
}
