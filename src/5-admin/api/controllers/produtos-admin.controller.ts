import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/guards/roles.guard';
import { Roles } from '../../../1-account-management/decorators/roles.decorator';
import { ROLE } from '../../../1-account-management/domain/types/role.types';
import { SalesService } from '../../../2-sales/application/services/sales.service';

@ApiTags('👑 Admin - Produtos')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
@ApiBearerAuth('JWT-auth')
export class ProdutosAdminController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todos os produtos (Admin)',
    description: 'Lista todos os produtos da plataforma com informações administrativas'
  })
  @ApiQuery({
    name: 'estabelecimento',
    required: false,
    type: 'string',
    description: 'Filtrar por estabelecimento'
  })
  @ApiQuery({
    name: 'categoria',
    required: false,
    type: 'string',
    description: 'Filtrar por categoria'
  })
  @ApiQuery({
    name: 'ativo',
    required: false,
    type: 'boolean',
    description: 'Filtrar por status ativo/inativo'
  })
  @ApiResponse({
    status: 200,
    description: 'Produtos listados com sucesso'
  })
  async listarTodosProdutos(
    @Query('estabelecimento') estabelecimento?: string,
    @Query('categoria') categoria?: string,
    @Query('ativo') ativo?: boolean
  ) {
    const filtros = {
      estabelecimento,
      categoria,
      ativo
    };
    
    // TODO: Implementar método administrativo específico que liste TODOS os produtos
    // incluindo inativos e com informações adicionais para administração
    return this.salesService.buscarProdutosPublico(filtros);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter produto por ID (Admin)',
    description: 'Obtém detalhes completos de um produto para administração'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Produto encontrado com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado'
  })
  async obterProdutoPorId(@Param('id') id: string) {
    return this.salesService.obterDetalhesProduto(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Criar novo produto (Admin)',
    description: 'Cria um novo produto no sistema (apenas administradores)'
  })
  @ApiBody({
    description: 'Dados do produto a ser criado',
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string', example: 'Produto Admin' },
        descricao: { type: 'string', example: 'Produto criado pelo admin' },
        preco: { type: 'number', example: 10.00 },
        categoriaId: { type: 'string', example: 'uuid-categoria' },
        estabelecimentoId: { type: 'string', example: 'uuid-estabelecimento' },
        estoque: { type: 'number', example: 100 },
        unidade: { type: 'string', example: 'un' },
        imagemUrl: { type: 'string', example: '/uploads/produtos/produto.jpg' },
        ativo: { type: 'boolean', example: true }
      },
      required: ['nome', 'preco', 'categoriaId', 'estabelecimentoId']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos'
  })  async criarProduto(@Req() req: any, @Body() dadosProduto: any) {
    // TODO: Implementar criação de produto administrativo
    // Deve permitir que admin crie produtos para qualquer estabelecimento
    return {
      message: 'Criação de produto administrativo em desenvolvimento',
      dados: dadosProduto
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar produto (Admin)',
    description: 'Atualiza um produto existente (apenas administradores)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Produto atualizado com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado'
  })  async atualizarProduto(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dadosAtualizacao: any
  ) {
    // TODO: Implementar atualização de produto administrativo
    // Deve permitir alteração de qualquer campo, incluindo estabelecimento
    return {
      message: 'Atualização de produto administrativo em desenvolvimento',
      id,
      dados: dadosAtualizacao
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir produto (Admin)',
    description: 'Remove um produto do sistema (soft delete)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Produto excluído com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado'
  })  async excluirProduto(@Req() req: any, @Param('id') id: string) {
    // TODO: Implementar exclusão de produto administrativo
    // Deve permitir que admin exclua qualquer produto
    return {
      message: 'Exclusão de produto administrativo em desenvolvimento',
      id
    };
  }

  @Put(':id/ativar')
  @ApiOperation({
    summary: 'Ativar produto (Admin)',
    description: 'Ativa um produto desativado'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Produto ativado com sucesso'
  })  async ativarProduto(@Param('id') id: string) {
    // TODO: Implementar ativação de produto
    return {
      message: 'Ativação de produto em desenvolvimento',
      id,
      status: 'ativo'
    };
  }

  @Put(':id/desativar')
  @ApiOperation({
    summary: 'Desativar produto (Admin)',
    description: 'Desativa um produto ativo'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Produto desativado com sucesso'
  })  async desativarProduto(@Param('id') id: string) {
    // TODO: Implementar desativação de produto
    return {
      message: 'Desativação de produto em desenvolvimento',
      id,
      status: 'inativo'
    };
  }
}
