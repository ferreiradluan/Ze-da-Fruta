import { Controller, Get, Post, UseGuards, Req, Param, Query, ValidationPipe, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { RoleType } from '../../../1-account-management/domain/enums/role-type.enum';
import { Public } from '../../../common/decorators/public.decorator';
import { SalesService } from '../../application/services/sales.service';

@Controller('sales/lojas')
export class LojasController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Listar todas as lojas',
    description: 'Retorna lista de todas as lojas/estabelecimentos ativos'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de lojas retornada com sucesso'
  })
  async listarLojas() {
    return this.salesService.listarEstabelecimentosPublico();
  }

  @Get(':id')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Obter detalhes da loja',
    description: 'Obtém informações detalhadas de uma loja específica'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da loja',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da loja retornados com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Loja não encontrada'
  })
  async obterDetalhesLoja(@Param('id') id: string) {
    return this.salesService.obterDetalhesLoja(id);
  }

  @Get(':id/produtos')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Listar produtos da loja',
    description: 'Lista todos os produtos disponíveis de uma loja específica'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da loja',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos da loja retornada com sucesso'
  })
  async listarProdutosDeLoja(@Param('id') id: string) {
    return this.salesService.listarProdutosDeLoja(id);
  }

  // Migrar funcionalidades de cupons
  @Post('cupom/validar')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Validar cupom',
    description: 'Valida um cupom de desconto e retorna informações sobre sua aplicação'
  })
  @ApiResponse({
    status: 200,
    description: 'Cupom validado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Cupom inválido ou expirado'
  })
  async validarCupom(@Body() { codigo, valorPedido }: { codigo: string, valorPedido: number }) {
    return this.salesService.validarCupom(codigo, valorPedido);
  }
}
