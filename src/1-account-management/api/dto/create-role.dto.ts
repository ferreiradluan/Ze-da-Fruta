import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nome da role',
    example: 'CLIENTE',
    enum: ['CLIENTE', 'LOJISTA', 'ENTREGADOR', 'MODERADOR', 'ADMIN']
  })
  @IsString()
  @IsIn(['CLIENTE', 'LOJISTA', 'ENTREGADOR', 'MODERADOR', 'ADMIN'], {
    message: 'Nome deve ser: CLIENTE, LOJISTA, ENTREGADOR, MODERADOR ou ADMIN'
  })
  nome!: string;

  @ApiProperty({
    description: 'Descrição da role',
    example: 'Usuário que realiza compras na plataforma',
    required: false
  })
  @IsOptional()
  @IsString()
  descricao?!: string;

  @ApiProperty({
    description: 'Se a role está ativa',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  ativa?: boolean = true;
}
