import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Endpoint raiz da aplicação' })
  @ApiResponse({ status: 200, description: 'Informações da API' })
  getRoot() {
    return {
      status: 'online',
      message: 'Bem-vindo à API do sistema de delivery',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: '/auth',
        users: '/users',
        products: '/products',
        categories: '/categories',
        pedidos: '/pedidos',
        entregas: '/entregas',
        enderecos: '/enderecos',
        estabelecimentos: '/estabelecimentos',
        cupons: '/cupons',
        pagamentos: '/pagamentos',
        upload: '/upload'
      },
      documentation: '/api' // URL da documentação Swagger
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Status da aplicação' })
  @Public()
  health() {
    return { status: 'ok' };
  }
}