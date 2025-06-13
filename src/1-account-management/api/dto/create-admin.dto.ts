import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Status do administrador',
    example: 'ATIVO',
    enum: ['ATIVO', 'INATIVO'],
    default: 'ATIVO'
  })
  @IsOptional()
  @IsString()
  status?: string = 'ATIVO';
}
