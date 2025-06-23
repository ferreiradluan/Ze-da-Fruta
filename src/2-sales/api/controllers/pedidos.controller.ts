import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, Req, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { ROLE } from '../../../1-account-management/domain/types/role.types';
import { SalesService } from '../../application/services/sales.service';
import { STATUS_PEDIDO, StatusPedido } from '../../domain/types/status-pedido.types';

@ApiTags('👤 Cliente - Pedidos')
@Controller('pedidos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PedidosController {
  constructor(private readonly salesService: SalesService) {}  @Post()
  @Roles(ROLE.USER, ROLE.ADMIN)
  @ApiOperation({
    summary: 'Criar novo pedido',
    description: 'Cria um novo pedido com os itens especificados seguindo o padrão DDD'
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou estoque insuficiente'
  })
  async criarPedido(@Req() req, @Body() dadosSacola: any) {
    try {
      console.log('=== DEBUG PEDIDO CONTROLLER ===');
      console.log('User ID:', req.user.id);
      console.log('Dados da sacola:', JSON.stringify(dadosSacola, null, 2));
      
      const resultado = await this.salesService.criarPedido(req.user.id, dadosSacola);
      
      console.log('Pedido criado com sucesso:', resultado.id);
      return resultado;
    } catch (error) {
      console.error('Erro no controller ao criar pedido:', error);
      throw error;
    }
  }@Get(':id')
  @Roles(ROLE.USER, ROLE.ADMIN)
  @ApiOperation({
    summary: 'Obter pedido específico',
    description: 'Obtém um pedido específico do cliente logado'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  async obterPedido(@Req() req, @Param('id') pedidoId: string) {
    return this.salesService.obterPedido(pedidoId, req.user.id);
  }  @Put(':id/cupom')
  @Roles(ROLE.USER, ROLE.ADMIN)
  @ApiOperation({
    summary: 'Aplicar cupom ao pedido',
    description: 'Aplica um cupom de desconto ao pedido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  async aplicarCupom(@Param('id') pedidoId: string, @Body() { codigo }: { codigo: string }) {
    return this.salesService.aplicarCupomAoPedido(pedidoId, codigo);
  }

  // Migrar funcionalidades de lojista:  @Get('loja/:estabelecimentoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.SELLER, ROLE.ADMIN)
  @ApiTags('🏪 Lojista - Pedidos')
  @ApiOperation({
    summary: 'Listar pedidos da loja',
    description: 'Lista pedidos de um estabelecimento específico (apenas para lojistas)'
  })
  @ApiParam({
    name: 'estabelecimentoId',
    description: 'ID do estabelecimento',
    type: 'string'
  })
  @ApiBearerAuth('JWT-auth')
  async listarPedidosLoja(@Param('estabelecimentoId') estabelecimentoId: string, @Query('status') status?: StatusPedido) {
    return this.salesService.listarPedidosPorEstabelecimento(estabelecimentoId, status);
  }

  // ===== ENDPOINTS CRUD PARA GESTÃO DE PEDIDOS =====

  /**
   * ✅ GET /pedidos - Listar meus pedidos
   */  @Get()
  @Roles(ROLE.USER, ROLE.ADMIN)
  @ApiOperation({
    summary: 'Listar meus pedidos',
    description: 'Lista todos os pedidos do cliente logado com filtros opcionais'
  })
  @ApiResponse({
    status: 200,
    description: 'Pedidos listados com sucesso'
  })
  async listarMeusPedidos(
    @Req() req, 
    @Query('status') status?: StatusPedido,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const clienteId = req.user.id;
    
    // TODO: Implementar listagem com paginação via SalesService
    // Por enquanto, simula a listagem
    return {
      pedidos: [
        {
          id: 'pedido-123',
          status: 'PAGO',
          valorTotal: 25.50,
          createdAt: new Date().toISOString(),
          itens: 3
        }
      ],
      total: 1,
      page,
      limit,
      clienteId
    };
  }

  /**
   * ✅ PUT /pedidos/:id/cancel - Cancelar pedido
   */  @Put(':id/cancel')
  @Roles(ROLE.USER, ROLE.ADMIN)
  @ApiOperation({
    summary: 'Cancelar pedido',
    description: 'Cancela um pedido do cliente se ainda permitido pelo status'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido cancelado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Pedido não pode ser cancelado'
  })
  async cancelarPedido(@Req() req, @Param('id') pedidoId: string, @Body() dados?: { motivo?: string }) {
    const clienteId = req.user.id;
    
    // TODO: Implementar cancelamento via SalesService com regras de negócio
    // - Verificar se pedido pertence ao cliente
    // - Verificar se status permite cancelamento
    // - Aplicar lógica de reembolso se necessário
    
    // Por enquanto, simula o cancelamento
    return {
      message: 'Pedido cancelado com sucesso',
      pedidoId,
      motivo: dados?.motivo || 'Cancelado pelo cliente',
      dataCancelamento: new Date().toISOString(),
      reembolso: {
        valor: 25.50,
        previsao: '3-5 dias úteis',
        metodo: 'Mesmo cartão da compra'
      },
      clienteId
    };
  }

  /**
   * ✅ DELETE /pedidos/:id/cupom - Remover cupom do pedido
   */  @Delete(':id/cupom')
  @Roles(ROLE.USER, ROLE.ADMIN)
  @ApiOperation({
    summary: 'Remover cupom do pedido',
    description: 'Remove o cupom aplicado a um pedido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Cupom removido com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado ou sem cupom aplicado'
  })
  async removerCupom(@Req() req, @Param('id') pedidoId: string) {
    const clienteId = req.user.id;
    
    // TODO: Implementar remoção de cupom via SalesService
    // Por enquanto, simula a remoção
    return {
      message: 'Cupom removido com sucesso',
      pedidoId,
      valorAnterior: 22.95,
      valorAtual: 25.50,
      descontoRemovido: 2.55,
      clienteId
    };
  }

  /**
   * ✅ PUT /pedidos/:id/endereco - Atualizar endereço de entrega
   */  @Put(':id/endereco')
  @Roles(ROLE.USER, ROLE.ADMIN)
  @ApiOperation({
    summary: 'Atualizar endereço de entrega',
    description: 'Atualiza o endereço de entrega de um pedido (apenas se permitido pelo status)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço atualizado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível alterar endereço neste status'
  })
  async atualizarEndereco(@Req() req, @Param('id') pedidoId: string, @Body() novoEndereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  }) {
    const clienteId = req.user.id;
    
    // TODO: Implementar atualização via SalesService com validações
    // - Verificar se pedido pertence ao cliente
    // - Verificar se status permite alteração
    // - Validar formato do endereço
    
    // Por enquanto, simula a atualização
    return {
      message: 'Endereço de entrega atualizado com sucesso',
      pedidoId,
      enderecoAnterior: 'Rua das Flores, 123',
      novoEndereco: `${novoEndereco.logradouro}, ${novoEndereco.numero}`,
      dataAtualizacao: new Date().toISOString(),
      clienteId
    };
  }

  /**
   * ✅ PUT /pedidos/:id/observacoes - Atualizar observações
   */  @Put(':id/observacoes')
  @Roles(ROLE.USER, ROLE.ADMIN)
  @ApiOperation({
    summary: 'Atualizar observações do pedido',
    description: 'Atualiza as observações de um pedido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Observações atualizadas com sucesso'
  })
  async atualizarObservacoes(@Req() req, @Param('id') pedidoId: string, @Body() dados: { observacoes: string }) {
    const clienteId = req.user.id;
    
    // TODO: Implementar atualização via SalesService
    // Por enquanto, simula a atualização
    return {
      message: 'Observações atualizadas com sucesso',
      pedidoId,
      observacoes: dados.observacoes,
      dataAtualizacao: new Date().toISOString(),
      clienteId
    };
  }

  /**
   * ✅ POST /pedidos/test-debug - Endpoint de teste para debug
   */  @Post('test-debug')
  @Roles(ROLE.USER, ROLE.ADMIN)
  @ApiOperation({
    summary: 'Endpoint de teste para debug',
    description: 'Endpoint temporário para debugar criação de pedidos'
  })
  async testCriarPedido(@Req() req, @Body() dadosSacola: any) {
    try {
      console.log('=== TESTE DEBUG PEDIDO ===');
      console.log('User:', JSON.stringify(req.user, null, 2));
      console.log('Dados recebidos:', JSON.stringify(dadosSacola, null, 2));
      
      // Testar primeiro a busca do produto
      console.log('1. Testando busca de produto...');
      const produto = await this.salesService.obterDetalhesProduto(dadosSacola.itens[0].produtoId);
      console.log('Produto encontrado:', JSON.stringify(produto, null, 2));
      
      // Agora tentar criar o pedido
      console.log('2. Tentando criar pedido...');
      const resultado = await this.salesService.criarPedido(req.user.id, dadosSacola);
      
      console.log('3. Pedido criado com sucesso!');
      return {
        success: true,
        pedido: resultado,
        message: 'Pedido criado com sucesso no teste'
      };    } catch (error: any) {
      console.error('ERRO DETALHADO:', error);
      console.error('Stack trace:', error.stack);
      
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        stack: error.stack || 'Stack não disponível',
        type: error.constructor?.name || 'Unknown'
      };
    }
  }
}
