import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginAdminDto {  @ApiProperty({
    description: 'Email do administrador',
    example: 'zedafruta@admin.com',
    format: 'email'
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email!: string;

  @ApiProperty({
    description: 'Senha do administrador',
    example: 'zedafruta321',
    minLength: 6
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha!: string;
}
