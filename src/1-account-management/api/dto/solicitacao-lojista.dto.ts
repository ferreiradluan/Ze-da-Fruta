import { IsString, IsEmail, IsOptional, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SolicitacaoLojistaDto {
  @ApiProperty({
    description: 'Nome completo do solicitante',
    example: 'João Silva'
  })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({
    description: 'E-mail do solicitante',
    example: 'joao.silva@email.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Telefone com DDD',
    example: '(11) 99999-9999'
  })
  @IsString()
  @IsNotEmpty()
  telefone!: string;

  @ApiProperty({
    description: 'CPF do solicitante (somente números)',
    example: '12345678901'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter exatamente 11 dígitos' })
  cpf!: string;

  @ApiProperty({
    description: 'Nome do estabelecimento comercial',
    example: 'Hortifruti do João'
  })
  @IsString()
  @IsNotEmpty()
  nomeEstabelecimento!: string;

  @ApiProperty({
    description: 'CNPJ do estabelecimento (somente números)',
    example: '12345678000123'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter exatamente 14 dígitos' })
  cnpj!: string;

  @ApiProperty({
    description: 'Descrição do tipo de negócio',
    example: 'Venda de frutas, verduras e legumes frescos'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Descrição deve ter pelo menos 10 caracteres' })
  descricaoNegocio!: string;

  @ApiProperty({
    description: 'Endereço do estabelecimento',
    example: 'Rua das Flores'
  })
  @IsString()
  @IsNotEmpty()
  endereco!: string;

  @ApiProperty({
    description: 'Número do endereço',
    example: '123'
  })
  @IsString()
  @IsNotEmpty()
  numeroEndereco!: string;
  @ApiProperty({
    description: 'Complemento do endereço',
    example: 'Loja 2',
    required: false
  })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro'
  })
  @IsString()
  @IsNotEmpty()
  bairro!: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo'
  })
  @IsString()
  @IsNotEmpty()
  cidade!: string;

  @ApiProperty({
    description: 'Estado (sigla)',
    example: 'SP'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2}$/, { message: 'Estado deve ser uma sigla de 2 letras maiúsculas' })
  estado!: string;

  @ApiProperty({
    description: 'CEP (somente números)',
    example: '01234567'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8}$/, { message: 'CEP deve conter exatamente 8 dígitos' })
  cep!: string;

  @ApiProperty({
    description: 'Observações adicionais',
    example: 'Tenho experiência de 5 anos no ramo de hortifruti',
    required: false
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
