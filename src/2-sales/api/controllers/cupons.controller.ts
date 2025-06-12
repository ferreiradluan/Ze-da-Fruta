import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { RoleType } from '../../../1-account-management/domain/enums/role-type.enum';
import { SalesService } from '../../application/services/sales.service';
import { CreateCupomDto, UpdateCupomDto } from '../dto/create-cupom.dto';

@ApiTags('🎫 Admin - Cupons')
@Controller('cupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CuponsController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Criar novo cupom',
    description: 'Cria um novo cupom de desconto (apenas admin)'
  })
  @ApiBody({ 
    type: CreateCupomDto,
    description: 'Dados necessários para criação do cupom'
  })
  @ApiResponse({
    status: 201,
    description: 'Cupom criado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou código já existe'
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  async criarCupom(@Req() req, @Body() createCupomDto: CreateCupomDto) {
    return this.salesService.criarCupom(req.user, createCupomDto);
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.USER)
  @ApiOperation({
    summary: 'Listar cupons',
    description: 'Lista cupons (admin vê todos, usuários veem apenas válidos)'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cupons retornada com sucesso'
  })
  async listarCupons(@Req() req) {
    return this.salesService.listarCupons(req.user);
  }

  @Get(':codigo')
  @Roles(RoleType.ADMIN, RoleType.USER)
  @ApiOperation({
    summary: 'Buscar cupom por código',
    description: 'Retorna os detalhes de um cupom específico'
  })
  @ApiParam({
    name: 'codigo',
    description: 'Código do cupom',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Cupom encontrado'
  })
  @ApiResponse({
    status: 404,
    description: 'Cupom não encontrado'
  })
  async buscarCupom(@Param('codigo') codigo: string) {
    return this.salesService.buscarCupomPorCodigo(codigo);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Atualizar cupom',
    description: 'Atualiza os dados de um cupom (apenas admin)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do cupom',
    type: 'string'
  })
  @ApiBody({ 
    type: UpdateCupomDto,
    description: 'Dados para atualização do cupom'
  })
  @ApiResponse({
    status: 200,
    description: 'Cupom atualizado com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Cupom não encontrado'
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  async atualizarCupom(@Req() req, @Param('id') id: string, @Body() updateCupomDto: UpdateCupomDto) {
    return this.salesService.atualizarCupom(req.user, id, updateCupomDto);
  }

  @Patch(':id/desativar')
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Desativar cupom',
    description: 'Desativa um cupom (apenas admin)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do cupom',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Cupom desativado com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Cupom não encontrado'
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  async desativarCupom(@Req() req, @Param('id') id: string) {
    return this.salesService.desativarCupom(req.user, id);
  }

  @Post('validar')
  @Roles(RoleType.USER)
  @ApiOperation({
    summary: 'Validar cupom',
    description: 'Valida se um cupom pode ser aplicado com um valor específico'
  })
  @ApiBody({
    description: 'Dados para validação do cupom',
    schema: {
      type: 'object',
      properties: {
        codigo: { 
          type: 'string', 
          example: 'DESCONTO10',
          description: 'Código do cupom a ser validado'
        },
        valorPedido: { 
          type: 'number', 
          example: 50.00,
          description: 'Valor total do pedido'
        }
      },
      required: ['codigo', 'valorPedido']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado da validação do cupom',
    schema: {
      type: 'object',
      properties: {
        valido: { type: 'boolean', example: true },
        motivo: { type: 'string', example: 'Cupom válido' },
        cupom: {
          type: 'object',
          properties: {
            codigo: { type: 'string', example: 'DESCONTO10' },
            tipoDesconto: { type: 'string', example: 'PERCENTUAL' },
            valor: { type: 'number', example: 10 }
          }
        }
      }
    }
  })
  async validarCupom(@Body() body: { codigo: string; valorPedido: number }) {
    return this.salesService.validarCupom(body.codigo, body.valorPedido);
  }
}
