import { Controller, Get, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Perfil, PerfilUsuario, PerfilGuard } from '../auth/guards/perfil.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard, PerfilGuard)
@Controller('entregador')
@Perfil(PerfilUsuario.ENTREGADOR)
export class EntregadorController {
  // GET /entregador/entregas/disponiveis
  @Get('entregas/disponiveis')
  async listarEntregasDisponiveis(@Req() req: Request) {
    // Lógica: buscar entregas disponíveis para o entregador
    return { message: 'Lista de entregas disponíveis' };
  }

  // PUT /entregador/entregas/:id/aceitar
  @Put('entregas/:id/aceitar')
  async aceitarEntrega(@Req() req: Request, @Param('id') id: number) {
    // Lógica: entregador aceita uma entrega
    return { message: `Entrega ${id} aceita pelo entregador` };
  }

  // GET /entregador/entregas/minhas
  @Get('entregas/minhas')
  async listarMinhasEntregas(@Req() req: Request) {
    // Lógica: listar entregas do entregador logado
    return { message: 'Lista de entregas do entregador' };
  }

  // PUT /entregador/entregas/:id/status
  @Put('entregas/:id/status')
  async atualizarStatusEntrega(@Req() req: Request, @Param('id') id: number, @Body('status') status: string) {
    // Lógica: atualizar status da entrega
    return { message: `Status da entrega ${id} atualizado para ${status}` };
  }

  // GET /entregador/historico
  @Get('historico')
  async historicoEntregas(@Req() req: Request) {
    // Lógica: histórico de entregas e ganhos
    return { message: 'Histórico de entregas e ganhos do entregador' };
  }

  // PUT /entregador/disponibilidade
  @Put('disponibilidade')
  async atualizarDisponibilidade(@Req() req: Request, @Body('disponivel') disponivel: boolean) {
    // Lógica: atualizar status de disponibilidade do entregador
    return { message: `Disponibilidade do entregador atualizada para ${disponivel}` };
  }
}
