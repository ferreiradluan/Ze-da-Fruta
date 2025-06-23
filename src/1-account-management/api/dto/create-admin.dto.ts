import { IsString, IsEmail, IsOptional, MinLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { STATUS_USUARIO, StatusUsuario, STATUS_USUARIO_VALUES } from '../../domain/types/status-usuario.types';

export class CreateAdminDto {
  @ApiProperty({
    description: 'Nome completo do administrador',
    example: 'Admin Sistema'
  })
  @IsString()
  nome!: string;

  @ApiProperty({
    description: 'E-mail do administrador',
    example: 'admin@sistema.com'
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Senha do administrador',
    example: 'SenhaSegura123!',
    minLength: 8
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  senha!: string;

  @ApiProperty({
    description: 'Status do administrador',    example: STATUS_USUARIO.ATIVO,
    enum: STATUS_USUARIO_VALUES,
    default: STATUS_USUARIO.ATIVO
  })
  @IsOptional()
  @IsIn(STATUS_USUARIO_VALUES)
  status?: StatusUsuario = STATUS_USUARIO.ATIVO;
}
