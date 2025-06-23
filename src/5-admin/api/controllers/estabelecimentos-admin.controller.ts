import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Put, 
  Delete,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { ROLE } from '../../../1-account-management/domain/types/role.types';
import { EstabelecimentoService } from '../../../2-sales/application/services/estabelecimento.service';

@Controller('admin/estabelecimentos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
@ApiBearerAuth()
@ApiTags('🔧 Admin - Estabelecimentos')
export class EstabelecimentosAdminController {
  constructor(private readonly estabelecimentoService: EstabelecimentoService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar estabelecimento',
    description: 'Cria um novo estabelecimento no sistema'
  })
  @ApiResponse({
    status: 201,
    description: 'Estabelecimento criado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos'
  })
  async criarEstabelecimento(@Body() dados: any) {
    return this.estabelecimentoService.criarEstabelecimento(dados);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os estabelecimentos',
    description: 'Lista todos os estabelecimentos (incluindo inativos)'
  })
  @ApiResponse({
    status: 200,
    description: 'Estabelecimentos listados com sucesso'
  })
  async listarTodos() {
    return this.estabelecimentoService.listarEstabelecimentosPublico();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter estabelecimento por ID',
    description: 'Obtém detalhes de um estabelecimento específico'
  })
  @ApiResponse({
    status: 200,
    description: 'Estabelecimento encontrado'
  })
  @ApiResponse({
    status: 404,
    description: 'Estabelecimento não encontrado'
  })
  async obterPorId(@Param('id') id: string) {
    return this.estabelecimentoService.obterDetalhesLoja(id);
  }
}
