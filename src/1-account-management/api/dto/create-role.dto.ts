import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ROLE_NAMES_ARRAY } from '../../domain/types/role.types';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nome da role',
    example: 'CLIENTE',
    enum: ROLE_NAMES_ARRAY
  })
  @IsString()
  @IsIn(ROLE_NAMES_ARRAY, {
    message: `Nome deve ser: ${ROLE_NAMES_ARRAY.join(', ')}`
  })
  nome!: string;

  @ApiProperty({
    description: 'Descrição da role',
    example: 'Usuário que realiza compras na plataforma',
    required: false
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Se a role está ativa',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  ativa?: boolean = true;
}
