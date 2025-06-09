import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
    required: false
  })
  @IsOptional()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome?: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@email.com',
    format: 'email',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email?: string;
  // senha não pode ser alterada por aqui normalmente
}
