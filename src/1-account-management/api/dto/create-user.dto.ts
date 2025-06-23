import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { STATUS_USUARIO, StatusUsuario, STATUS_USUARIO_VALUES } from '../../domain/types/status-usuario.types';

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
  email!: string;  @ApiProperty({
    description: 'Status do usuário',
    example: STATUS_USUARIO.PENDENTE,
    enum: STATUS_USUARIO_VALUES,
    default: STATUS_USUARIO.PENDENTE
  })
  @IsOptional()
  @IsIn(STATUS_USUARIO_VALUES)
  status?: StatusUsuario = STATUS_USUARIO.PENDENTE;
}
