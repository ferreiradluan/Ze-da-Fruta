import { Controller, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../1-account-management/guards/jwt-auth.guard';
import { RolesGuard } from '../1-account-management/guards/roles.guard';
import { Roles } from '../1-account-management/decorators/roles.decorator';
import { Role3 } from '../1-account-management/enums/role.enum';
import { AdminService } from './admin.service';

@ApiTags('👑 Admin - Gestão')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role3.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('aprovar-loja/:solicitacaoId')
  @ApiOperation({
    summary: 'Aprovar solicitação de loja',
    description: 'Aprova uma solicitação de parceiro para criar uma loja'
  })
  @ApiResponse({ status: 200, description: 'Solicitação aprovada com sucesso' })
  async aprovarLoja(@Param('solicitacaoId') solicitacaoId: string) {
    return await this.adminService.aprovarSolicitacaoParceiro(solicitacaoId);
  }

  @Put('suspender-usuario/:usuarioId')
  @ApiOperation({
    summary: 'Suspender usuário',
    description: 'Atualiza o status de um usuário para suspenso'
  })
  @ApiResponse({ status: 200, description: 'Status do usuário atualizado' })
  async suspenderUsuario(
    @Param('usuarioId') usuarioId: string,
    @Body() dto: { novoStatus: string; motivo?: string }
  ) {
    return await this.adminService.atualizarStatusUsuario(usuarioId, dto.novoStatus);
  }

  @Post('processar-reembolso/:pedidoId')
  @ApiOperation({
    summary: 'Processar reembolso',
    description: 'Inicia o processo de reembolso para um pedido'
  })
  @ApiResponse({ status: 200, description: 'Reembolso iniciado com sucesso' })
  async processarReembolso(
    @Param('pedidoId') pedidoId: string,
    @Body() dto: { valor: number; motivo: string }
  ) {
    return await this.adminService.iniciarReembolsoPedido(pedidoId, dto);
  }

  @Post('cupons-globais')
  @ApiOperation({
    summary: 'Criar cupom global',
    description: 'Cria um cupom de desconto global para toda a plataforma'
  })
  @ApiResponse({ status: 201, description: 'Cupom global criado com sucesso' })
  async criarCupomGlobal(@Body() dto: any) {
    return await this.adminService.criarCupomGlobal(dto);
  }

  @Put('cupons/:cupomId/desativar')
  @ApiOperation({
    summary: 'Desativar cupom',
    description: 'Desativa um cupom específico'
  })
  @ApiResponse({ status: 200, description: 'Cupom desativado com sucesso' })
  async desativarCupom(@Param('cupomId') cupomId: string) {
    return await this.adminService.desativarCupom(cupomId);
  }
}
