import { IsString, IsEmail, IsOptional, IsNotEmpty, Matches, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SolicitacaoEntregadorDto {
  @ApiProperty({
    description: 'Nome completo do solicitante',
    example: 'Maria Oliveira'
  })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({
    description: 'E-mail do solicitante',
    example: 'maria.oliveira@email.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Telefone com DDD',
    example: '(11) 88888-8888'
  })
  @IsString()
  @IsNotEmpty()
  telefone!: string;

  @ApiProperty({
    description: 'CPF do solicitante (somente números)',
    example: '98765432109'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter exatamente 11 dígitos' })
  cpf!: string;

  @ApiProperty({
    description: 'Tipo de veículo utilizado para entregas',
    example: 'moto',
    enum: ['moto', 'bicicleta', 'carro', 'a_pe']
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['moto', 'bicicleta', 'carro', 'a_pe'], { 
    message: 'Tipo de veículo deve ser: moto, bicicleta, carro ou a_pe' 
  })
  tipoVeiculo!: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Honda CG 160'
  })
  @IsString()
  @IsNotEmpty()
  modeloVeiculo!: string;

  @ApiProperty({
    description: 'Placa do veículo (formato ABC-1234)',
    example: 'ABC-1234'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}-\d{4}$/, { message: 'Placa deve estar no formato ABC-1234' })
  placaVeiculo!: string;

  @ApiProperty({
    description: 'Número da CNH',
    example: '12345678901'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'Número da CNH deve conter exatamente 11 dígitos' })
  numeroCNH!: string;

  @ApiProperty({
    description: 'Endereço residencial',
    example: 'Rua das Palmeiras'
  })
  @IsString()
  @IsNotEmpty()
  endereco!: string;

  @ApiProperty({
    description: 'Número do endereço',
    example: '456'
  })
  @IsString()
  @IsNotEmpty()
  numeroEndereco!: string;

  @ApiProperty({
    description: 'Complemento do endereço',
    example: 'Apto 101',
    required: false
  })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Vila Nova'
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
    example: 'Tenho 3 anos de experiência em delivery',
    required: false
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
