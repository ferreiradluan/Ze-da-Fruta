import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('admin')
@ApiTags('admin')
export class AdminAuthController {
  @Post('login')
  @ApiOperation({ summary: 'Login de administrador' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: { email: string; senha: string }) {
    // TODO: Implementar lógica de autenticação de admin
    return { message: 'Login de admin não implementado.' };
  }
}
