import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role3 } from '../../enums/role.enum';
import { SalesService } from '../../../2-sales/application/services/sales.service';

@ApiTags('🏪 Parceiro - Produtos')
@Controller('partner/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role3.SELLER)
@ApiBearerAuth('JWT-auth')
export class PartnerProductsController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar produtos do parceiro',
    description: 'Lista todos os produtos associados ao parceiro autenticado'
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
    description: 'Lista de produtos do parceiro retornada com sucesso'
  })
  async listarProdutosDoParceiro(
    @Req() req,
    @Query('categoria') categoria?: string,
    @Query('ativo') ativo?: boolean
  ) {
    const parceiroId = req.user.id;
    
    // TODO: Implementar método específico para produtos do parceiro
    // Por enquanto usa método existente
    try {
      return await this.salesService.listarProdutosDeLoja(parceiroId);
    } catch (error) {
      return [];
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter produto específico',
    description: 'Obtém detalhes de um produto específico do parceiro'
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
  async obterProduto(@Req() req, @Param('id') produtoId: string) {
    // TODO: Validar se o produto pertence ao parceiro
    return await this.salesService.obterDetalhesProduto(produtoId);
  }

  @Post()
  @ApiOperation({
    summary: 'Criar novo produto',
    description: 'Cria um novo produto para o estabelecimento do parceiro'
  })
  @ApiBody({
    description: 'Dados do produto a ser criado',
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string', example: 'Maçã Argentina' },
        descricao: { type: 'string', example: 'Maçã fresca importada da Argentina' },
        preco: { type: 'number', example: 4.50 },
        categoria: { type: 'string', example: 'Frutas' },
        estoque: { type: 'number', example: 100 },
        unidade: { type: 'string', example: 'kg' },
        imagemUrl: { type: 'string', example: '/uploads/produtos/maca.jpg' }
      },
      required: ['nome', 'preco', 'categoria']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos'
  })
  async criarProduto(@Req() req, @Body() dadosProduto: any) {
    const parceiroId = req.user.id;
    
    // TODO: Implementar criação de produto específica para parceiro
    // Incluir estabelecimentoId automaticamente baseado no parceiro
    throw new Error('Criação de produto ainda não implementada - aguardando refatoração');
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar produto',
    description: 'Atualiza um produto existente do parceiro'
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
  })
  async atualizarProduto(
    @Req() req,
    @Param('id') produtoId: string,
    @Body() dadosAtualizacao: any
  ) {
    const parceiroId = req.user.id;
    
    // TODO: Implementar atualização de produto específica para parceiro
    // Validar se o produto pertence ao parceiro
    throw new Error('Atualização de produto ainda não implementada - aguardando refatoração');
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desativar produto',
    description: 'Desativa um produto do parceiro (soft delete)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Produto desativado com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado'
  })
  async desativarProduto(@Req() req, @Param('id') produtoId: string) {
    const parceiroId = req.user.id;
    
    // TODO: Implementar desativação de produto específica para parceiro
    // Validar se o produto pertence ao parceiro
    throw new Error('Desativação de produto ainda não implementada - aguardando refatoração');
  }
}
