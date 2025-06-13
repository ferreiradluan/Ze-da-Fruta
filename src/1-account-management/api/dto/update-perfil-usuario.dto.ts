import { IsString, IsOptional, IsDateString, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePerfilUsuarioDto {
  @ApiProperty({
    description: 'Telefone do usuário',
    example: '(11) 99999-9999',
    required: false
  })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({
    description: 'Documento (CPF/CNPJ)',
    example: '12345678901',
    required: false
  })
  @IsOptional()
  @IsString()
  documento?: string;

  @ApiProperty({
    description: 'Tipo do documento',
    example: 'CPF',
    enum: ['CPF', 'CNPJ'],
    required: false
  })
  @IsOptional()
  @IsString()
  @IsIn(['CPF', 'CNPJ'], { message: 'Tipo do documento deve ser CPF ou CNPJ' })
  tipoDocumento?: string;

  @ApiProperty({
    description: 'Data de nascimento',
    example: '1990-01-01',
    required: false
  })
  @IsOptional()
  @IsDateString()
  dataNascimento?: string;

  @ApiProperty({
    description: 'Gênero do usuário',
    example: 'M',
    enum: ['M', 'F', 'OUTRO', 'NAO_INFORMADO'],
    required: false
  })
  @IsOptional()
  @IsString()
  @IsIn(['M', 'F', 'OUTRO', 'NAO_INFORMADO'], {
    message: 'Gênero deve ser: M, F, OUTRO ou NAO_INFORMADO'
  })
  genero?: string;

  @ApiProperty({
    description: 'Biografia do usuário',
    example: 'Apaixonado por tecnologia e inovação',
    required: false
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: 'Status do perfil',
    example: 'COMPLETO',
    enum: ['COMPLETO', 'INCOMPLETO', 'VERIFICADO'],
    required: false
  })
  @IsOptional()
  @IsString()
  @IsIn(['COMPLETO', 'INCOMPLETO', 'VERIFICADO'], {
    message: 'Status deve ser: COMPLETO, INCOMPLETO ou VERIFICADO'
  })
  statusPerfil?: string;

  @ApiProperty({
    description: 'Se o email foi verificado',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  emailVerificado?: boolean;

  @ApiProperty({
    description: 'Se o telefone foi verificado',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  telefoneVerificado?: boolean;

  @ApiProperty({
    description: 'Se o documento foi verificado',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  documentoVerificado?: boolean;
}
