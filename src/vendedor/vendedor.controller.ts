import { Controller, Get, Post, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Perfil, PerfilUsuario, PerfilGuard } from '../auth/guards/perfil.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard, PerfilGuard)
@Controller('vendedor')
@Perfil(PerfilUsuario.VENDEDOR)
export class VendedorController {
  // GET /vendedor/dashboard
  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    // Lógica: buscar vendas, pedidos pendentes e faturamento do vendedor logado
    // Exemplo: return this.vendedorService.getDashboard(req.user.id);
    return { message: 'Resumo do dashboard do vendedor' };
  }

  // GET /vendedor/produtos
  @Get('produtos')
  async listarProdutos(@Req() req: Request) {
    // Lógica: listar produtos do vendedor logado
    return { message: 'Lista de produtos do vendedor' };
  }

  // POST /vendedor/produtos
  @Post('produtos')
  async criarProduto(@Req() req: Request, @Body() produtoDto: any) {
    // Lógica: criar produto para o vendedor logado
    return { message: 'Produto criado para o vendedor' };
  }

  // PUT /vendedor/produtos/:id
  @Put('produtos/:id')
  async atualizarProduto(@Req() req: Request, @Param('id') id: number, @Body() produtoDto: any) {
    // Lógica: atualizar produto do vendedor logado
    return { message: `Produto ${id} atualizado para o vendedor` };
  }

  // GET /vendedor/pedidos
  @Get('pedidos')
  async listarPedidos(@Req() req: Request) {
    // Lógica: listar pedidos recebidos pelo estabelecimento do vendedor
    return { message: 'Lista de pedidos recebidos pelo vendedor' };
  }

  // PUT /vendedor/pedidos/:id/status
  @Put('pedidos/:id/status')
  async atualizarStatusPedido(@Req() req: Request, @Param('id') id: number, @Body('status') status: string) {
    // Lógica: atualizar status do pedido
    return { message: `Status do pedido ${id} atualizado para ${status}` };
  }

  // GET /vendedor/estabelecimento
  @Get('estabelecimento')
  async getEstabelecimento(@Req() req: Request) {
    // Lógica: retornar dados do estabelecimento do vendedor logado
    return { message: 'Dados do estabelecimento do vendedor' };
  }

  // PUT /vendedor/estabelecimento
  @Put('estabelecimento')
  async atualizarEstabelecimento(@Req() req: Request, @Body() estabelecimentoDto: any) {
    // Lógica: atualizar dados do estabelecimento do vendedor logado
    return { message: 'Estabelecimento atualizado' };
  }
}
