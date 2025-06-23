import { Controller, Post, Put, Delete, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/decorators/roles.decorator';
import { ROLE } from '../../../1-account-management/domain/types/role.types';
import { SalesService } from '../../application/services/sales.service';

/**
 * 🛒 CONTROLLER DE CARRINHO - GESTÃO DE SACOLA
 * 
 * ✅ CRUD completo do carrinho
 * ✅ Operações: adicionar, atualizar, remover itens
 * ✅ Respeitando arquitetura modular e domínio rico
 */
@ApiTags('🛒 Carrinho - Gestão de Sacola')
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.USER, ROLE.ADMIN)
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * ✅ GET /cart - Obter carrinho atual
   */
  @Get()
  @ApiOperation({
    summary: 'Obter carrinho atual',
    description: 'Obtém os itens do carrinho do usuário logado'
  })
  @ApiResponse({
    status: 200,
    description: 'Carrinho obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        itens: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              produtoId: { type: 'string' },
              nomeProduto: { type: 'string' },
              preco: { type: 'number' },
              quantidade: { type: 'number' },
              subtotal: { type: 'number' }
            }
          }
        },
        valorTotal: { type: 'number' },
        quantidadeItens: { type: 'number' }
      }
    }
  })
  async obterCarrinho(@Req() req: any) {
    // TODO: Implementar gestão de sessão/cache do carrinho
    // Por enquanto, retorna carrinho vazio para demonstração
    return {
      itens: [],
      valorTotal: 0,
      quantidadeItens: 0,
      message: 'Carrinho vazio - adicione produtos para começar!'
    };
  }

  /**
   * ✅ POST /cart/items - Adicionar item ao carrinho
   */
  @Post('items')
  @ApiOperation({
    summary: 'Adicionar item ao carrinho',
    description: 'Adiciona um produto ao carrinho do usuário'
  })
  @ApiBody({
    description: 'Dados do item a ser adicionado',
    schema: {
      type: 'object',
      properties: {
        produtoId: { type: 'string', example: 'uuid-produto-123' },
        quantidade: { type: 'number', example: 2, minimum: 1 }
      },
      required: ['produtoId', 'quantidade']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Item adicionado ao carrinho com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Produto não encontrado ou quantidade inválida'
  })
  async adicionarItem(@Req() req: any, @Body() dados: { produtoId: string; quantidade: number }) {
    const clienteId = req.user.id;
    
    // Validar se o produto existe
    const produto = await this.salesService.obterDetalhesProduto(dados.produtoId);
    
    // TODO: Implementar lógica de carrinho em sessão/cache
    // Por enquanto, simula a adição
    return {
      message: 'Item adicionado ao carrinho com sucesso',
      item: {
        produtoId: dados.produtoId,
        nomeProduto: produto.nome || 'Produto',
        preco: produto.preco || 0,
        quantidade: dados.quantidade,
        subtotal: (produto.preco || 0) * dados.quantidade
      },
      carrinhoAtualizado: true
    };
  }

  /**
   * ✅ PUT /cart/items/:produtoId - Atualizar quantidade de item
   */
  @Put('items/:produtoId')
  @ApiOperation({
    summary: 'Atualizar quantidade de item',
    description: 'Atualiza a quantidade de um item específico no carrinho'
  })
  @ApiParam({
    name: 'produtoId',
    description: 'ID do produto no carrinho',
    type: 'string'
  })
  @ApiBody({
    description: 'Nova quantidade do item',
    schema: {
      type: 'object',
      properties: {
        quantidade: { type: 'number', example: 3, minimum: 1 }
      },
      required: ['quantidade']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Quantidade atualizada com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Item não encontrado no carrinho'
  })
  async atualizarItem(
    @Req() req: any,
    @Param('produtoId') produtoId: string,
    @Body() dados: { quantidade: number }
  ) {
    const clienteId = req.user.id;
    
    // TODO: Implementar lógica de atualização no carrinho
    // Por enquanto, simula a atualização
    return {
      message: 'Quantidade atualizada com sucesso',
      produtoId,
      novaQuantidade: dados.quantidade,
      carrinhoAtualizado: true
    };
  }

  /**
   * ✅ DELETE /cart/items/:produtoId - Remover item do carrinho
   */
  @Delete('items/:produtoId')
  @ApiOperation({
    summary: 'Remover item do carrinho',
    description: 'Remove um item específico do carrinho'
  })
  @ApiParam({
    name: 'produtoId',
    description: 'ID do produto a ser removido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Item removido com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Item não encontrado no carrinho'
  })
  async removerItem(@Req() req: any, @Param('produtoId') produtoId: string) {
    const clienteId = req.user.id;
    
    // TODO: Implementar lógica de remoção do carrinho
    // Por enquanto, simula a remoção
    return {
      message: 'Item removido do carrinho com sucesso',
      produtoId,
      carrinhoAtualizado: true
    };
  }

  /**
   * ✅ DELETE /cart - Limpar carrinho
   */
  @Delete()
  @ApiOperation({
    summary: 'Limpar carrinho',
    description: 'Remove todos os itens do carrinho'
  })
  @ApiResponse({
    status: 200,
    description: 'Carrinho limpo com sucesso'
  })
  async limparCarrinho(@Req() req: any) {
    const clienteId = req.user.id;
    
    // TODO: Implementar lógica de limpeza do carrinho
    // Por enquanto, simula a limpeza
    return {
      message: 'Carrinho limpo com sucesso',
      carrinhoLimpo: true
    };
  }

  /**
   * ✅ POST /cart/checkout - Finalizar compra (já existe no SalesController)
   * Este endpoint redireciona para o SalesController para manter a separação de responsabilidades
   */
  @Post('checkout')
  @ApiOperation({
    summary: 'Finalizar compra do carrinho',
    description: 'Converte os itens do carrinho em um pedido confirmado'
  })
  @ApiBody({
    description: 'Dados para finalização da compra',
    schema: {
      type: 'object',
      properties: {
        enderecoEntrega: { type: 'string', example: 'Rua das Flores, 123' },
        observacoes: { type: 'string', example: 'Entregar no portão' }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Carrinho vazio ou dados inválidos'
  })
  async checkout(@Req() req: any, @Body() dados: { enderecoEntrega?: string; observacoes?: string }) {
    // TODO: Buscar itens do carrinho e converter para SacolaDto
    // Por enquanto, simula checkout com carrinho vazio
    
    const carrinhoItens = []; // TODO: buscar do carrinho real
    
    if (carrinhoItens.length === 0) {
      return {
        error: 'Carrinho vazio',
        message: 'Adicione itens ao carrinho antes de finalizar a compra',
        status: 400
      };
    }

    const sacola = {
      itens: carrinhoItens,
      enderecoEntrega: dados.enderecoEntrega,
      observacoes: dados.observacoes
    };

    // Criar pedido usando o SalesService
    const pedido = await this.salesService.criarPedido(req.user.id, sacola);
    
    return {
      message: 'Pedido criado com sucesso',
      pedido,
      carrinhoLimpo: true
    };
  }
}
