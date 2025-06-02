import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PerfilGuard } from '../auth/guards/perfil.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { CuponsService } from '../cupons/cupons.service';
import { UsersService } from '../users/users.service';
import { EstabelecimentosService } from '../estabelecimentos/estabelecimentos.service';
import { PerfilUsuarioService } from '../perfil-usuario/perfil-usuario.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { StripeService } from '../pagamentos/stripe.service';
import { PerfilUsuario, StatusAprovacaoPerfil } from '../common/entities/perfil-usuario.entity';

@UseGuards(JwtAuthGuard, RolesGuard, PerfilGuard)
@Controller('admin')
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly cuponsService: CuponsService,
    private readonly usersService: UsersService,
    private readonly estabelecimentosService: EstabelecimentosService,
    private readonly perfilUsuarioService: PerfilUsuarioService,
    private readonly pedidosService: PedidosService,
    private readonly pagamentosService: PagamentosService,
    private readonly stripeService: StripeService,
  ) {}

  // Dashboard
  @Get('dashboard')
  async dashboard() {
    // Estatísticas gerais do sistema
    const [usuarios, vendedores, entregadores, pedidos, pagamentos, estabelecimentosPendentes, entregadoresPendentes] = await Promise.all([
      this.usersService.findAll(),
      this.perfilUsuarioService['perfilRepository'].count({ where: { perfil: PerfilUsuario.VENDEDOR, status_aprovacao: StatusAprovacaoPerfil.APROVADO } }),
      this.perfilUsuarioService['perfilRepository'].count({ where: { perfil: PerfilUsuario.ENTREGADOR, status_aprovacao: StatusAprovacaoPerfil.APROVADO } }),
      this.pedidosService.findAll(),
      this.pagamentosService.findAll(),
      this.estabelecimentosService.findPendentes(),
      this.perfilUsuarioService['perfilRepository'].count({ where: { perfil: PerfilUsuario.ENTREGADOR, status_aprovacao: StatusAprovacaoPerfil.PENDENTE } }),
    ]);
    const hoje = new Date();
    const pedidosHoje = pedidos.filter(p => {
      const data = new Date(p.createdAt);
      return data.toDateString() === hoje.toDateString();
    }).length;
    const faturamentoDia = pagamentos.filter(p => {
      const data = new Date(p.updatedAt);
      return (p.status === 'APROVADO' || p.status === 'SUCCEEDED') && data.toDateString() === hoje.toDateString();
    }).reduce((acc, p) => acc + p.valor, 0);
    const faturamentoMes = pagamentos.filter(p => {
      const data = new Date(p.updatedAt);
      return (p.status === 'APROVADO' || p.status === 'SUCCEEDED') && data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
    }).reduce((acc, p) => acc + p.valor, 0);
    return {
      usuarios: usuarios.length,
      vendedores,
      entregadores,
      pedidosHoje,
      faturamentoDia,
      faturamentoMes,
      solicitacoesPendentes: estabelecimentosPendentes.length + entregadoresPendentes,
    };
  }

  // Gestão de Usuários
  @Get('usuarios')
  async listarUsuarios(@Query() filtro: any) {
    // Filtros: nome, email, perfil, status
    return this.usersService.findAll(filtro);
  }

  @Get('usuarios/:id')
  async detalhesUsuario(@Param('id') id: number) {
    return this.usersService.findOneDetalhado(id);
  }

  @Put('usuarios/:id/status')
  async alterarStatusUsuario(@Param('id') id: number, @Body('status') status: string) {
    return this.usersService.alterarStatus(id, status);
  }

  @Put('usuarios/:id/roles')
  async alterarPerfisUsuario(@Param('id') id: number, @Body('perfis') perfis: string[]) {
    return this.usersService.alterarPerfis(id, perfis);
  }

  @Delete('usuarios/:id')
  async removerUsuario(@Param('id') id: number) {
    await this.usersService.remove(id);
    return { message: 'Usuário removido com sucesso.' };
  }

  // Gestão de Estabelecimentos
  @Get('estabelecimentos')
  async listarEstabelecimentos(@Query() filtro: any) {
    // Filtros: nome, cidade, status
    return this.estabelecimentosService.findAll(filtro);
  }

  @Get('estabelecimentos/pendentes')
  async listarEstabelecimentosPendentes() {
    return this.estabelecimentosService.findPendentes();
  }

  @Put('estabelecimentos/:id/status')
  async alterarStatusEstabelecimento(@Param('id') id: number, @Body('status') status: string) {
    await this.estabelecimentosService.update(id, { status });
    return { message: 'Status do estabelecimento atualizado.' };
  }

  // Gestão de Entregadores
  @Get('entregadores')
  async listarEntregadores(@Query() filtro: any) {
    // Filtro: nome, email, status_aprovacao
    const where: any = { perfil: PerfilUsuario.ENTREGADOR };
    if (filtro?.status_aprovacao) where.status_aprovacao = filtro.status_aprovacao;
    // Busca por nome/email do usuário
    const relations = ['usuario'];
    const perfis = await this.perfilUsuarioService['perfilRepository'].find({ where, relations });
    if (filtro?.nome) {
      return perfis.filter(p => p.usuario.firstName?.toLowerCase().includes(filtro.nome.toLowerCase()));
    }
    if (filtro?.email) {
      return perfis.filter(p => p.usuario.email?.toLowerCase().includes(filtro.email.toLowerCase()));
    }
    return perfis;
  }

  @Get('entregadores/pendentes')
  async listarEntregadoresPendentes() {
    // Lista todos os entregadores com status_aprovacao = 'pendente'
    const perfis = await this.perfilUsuarioService['perfilRepository'].find({
      where: { perfil: PerfilUsuario.ENTREGADOR, status_aprovacao: StatusAprovacaoPerfil.PENDENTE },
      relations: ['usuario'],
    });
    return perfis;
  }

  @Put('entregadores/:id/status')
  async alterarStatusEntregador(
    @Param('id') id: number,
    @Body('status_aprovacao') status_aprovacao: StatusAprovacaoPerfil
  ) {
    if (!status_aprovacao) {
      return { message: 'Campo status_aprovacao é obrigatório.' };
    }
    await this.perfilUsuarioService['perfilRepository'].update(id, { status_aprovacao });
    return { message: 'Status do entregador atualizado.' };
  }

  // Gestão de Pedidos e Finanças
  @Get('pedidos')
  async listarPedidos(@Query() filtro: any) {
    // Filtros: status, userId
    const all = await this.pedidosService.findAll();
    let pedidos = all;
    if (filtro?.status) pedidos = pedidos.filter(p => p.status === filtro.status);
    if (filtro?.userId) pedidos = pedidos.filter(p => p.user?.userId == filtro.userId);
    return pedidos;
  }

  @Get('pedidos/:id')
  async detalhesPedido(@Param('id') id: number) {
    return this.pedidosService.findOne(id);
  }

  @Post('pedidos/:id/reembolso')
  async reembolsarPedido(@Param('id') id: number) {
    // Busca o pagamento relacionado ao pedido
    const pagamentos = await this.pagamentosService.findAll();
    const pagamento = pagamentos.find(p => p.pedidoId == id);
    if (!pagamento || !pagamento.stripePaymentIntentId) {
      return { message: 'Pagamento não encontrado ou não é Stripe.' };
    }
    // Solicita reembolso via Stripe
    await this.stripeService['stripe'].refunds.create({ payment_intent: pagamento.stripePaymentIntentId });
    await this.pagamentosService.update(pagamento.pagamentoId, { status: 'REEMBOLSADO' });
    return { message: 'Reembolso iniciado.' };
  }

  @Get('financeiro/relatorios')
  async relatoriosFinanceiros(@Query() filtro: any) {
    // Exemplo simples: total de pedidos, total faturado, total reembolsado
    const pedidos = await this.pedidosService.findAll();
    const pagamentos = await this.pagamentosService.findAll();
    const totalPedidos = pedidos.length;
    const totalFaturado = pagamentos.filter(p => p.status === 'APROVADO' || p.status === 'SUCCEEDED').reduce((acc, p) => acc + p.valor, 0);
    const totalReembolsado = pagamentos.filter(p => p.status === 'REEMBOLSADO').reduce((acc, p) => acc + p.valor, 0);
    return { totalPedidos, totalFaturado, totalReembolsado };
  }

  // Gestão de Cupons
  @Post('cupons')
  async criarCupom(@Body() cupomDto: any) {
    return this.cuponsService.create(cupomDto);
  }

  @Get('cupons')
  async listarCupons(@Query() filtro: any) {
    return this.cuponsService.findAll();
  }

  @Get('cupons/:id')
  async detalhesCupom(@Param('id') id: number) {
    return this.cuponsService.findOne(id);
  }

  @Put('cupons/:id')
  async editarCupom(@Param('id') id: number, @Body() cupomDto: any) {
    return this.cuponsService.update(id, cupomDto);
  }

  @Delete('cupons/:id')
  async removerCupom(@Param('id') id: number) {
    await this.cuponsService.remove(id);
    return { message: 'Cupom removido com sucesso.' };
  }
}
