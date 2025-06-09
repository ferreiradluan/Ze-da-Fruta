import { Controller, Get, Post, Put, Delete, UseGuards, Req, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../application/strategies/guards/roles.guard';
import { Roles } from '../../application/strategies/guards/roles.decorator';
import { RoleType } from '../../domain/enums/role-type.enum';

@ApiTags('👤 Cliente - Endereços')
@Controller('address')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AddressController {
  @Get('meus-enderecos')
  @Roles(RoleType.USER, RoleType.PARTNER)
  @ApiOperation({
    summary: 'Meus endereços',
    description: 'Lista todos os endereços cadastrados do usuário autenticado. Usado para entrega de pedidos e cadastro de estabelecimentos.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de endereços retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'uuid-do-usuario' },
        enderecos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-do-endereco' },
              apelido: { type: 'string', example: 'Casa', description: 'Nome amigável do endereço' },
              rua: { type: 'string', example: 'Rua das Flores' },
              numero: { type: 'string', example: '123' },
              complemento: { type: 'string', example: 'Apto 45', nullable: true },
              bairro: { type: 'string', example: 'Centro' },
              cidade: { type: 'string', example: 'São Paulo' },
              estado: { type: 'string', example: 'SP' },
              cep: { type: 'string', example: '01234-567' },
              latitude: { type: 'number', example: -23.5505, nullable: true },
              longitude: { type: 'number', example: -46.6333, nullable: true },
              principal: { type: 'boolean', example: true, description: 'Se é o endereço principal' },
              ativo: { type: 'boolean', example: true },
              criadoEm: { type: 'string', format: 'date-time' },
              atualizadoEm: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - usuário não autenticado'
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado'
  })
  getAddresses(@Req() req) {
    // Exemplo: retorna endereços do usuário autenticado
    return { 
      userId: req.user.id, 
      enderecos: [
        {
          id: 'exemplo-endereco-1',
          apelido: 'Casa',
          rua: 'Rua das Flores',
          numero: '123',
          complemento: 'Apto 45',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          latitude: -23.5505,
          longitude: -46.6333,
          principal: true,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        },
        {
          id: 'exemplo-endereco-2',
          apelido: 'Trabalho',
          rua: 'Av. Paulista',
          numero: '1000',
          complemento: 'Sala 201',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01310-100',
          latitude: -23.5618,
          longitude: -46.6565,
          principal: false,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        }
      ]
    };
  }

  @Post()
  @Roles(RoleType.USER, RoleType.PARTNER)
  @ApiOperation({
    summary: 'Adicionar novo endereço',
    description: 'Adiciona um novo endereço para o usuário autenticado.'
  })
  @ApiBody({
    description: 'Dados do novo endereço',
    schema: {
      type: 'object',
      properties: {
        apelido: { type: 'string', example: 'Casa', description: 'Nome amigável do endereço' },
        rua: { type: 'string', example: 'Rua das Flores' },
        numero: { type: 'string', example: '123' },
        complemento: { type: 'string', example: 'Apto 45', nullable: true },
        bairro: { type: 'string', example: 'Centro' },
        cidade: { type: 'string', example: 'São Paulo' },
        estado: { type: 'string', example: 'SP' },
        cep: { type: 'string', example: '01234567' },
        principal: { type: 'boolean', example: false, description: 'Se é o endereço principal' }
      },
      required: ['apelido', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'cep']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Endereço criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-do-endereco' },
        message: { type: 'string', example: 'Endereço adicionado com sucesso' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos'
  })
  adicionarEndereco(@Req() req, @Body() enderecoData: any) {
    // TODO: Implementar lógica para adicionar endereço
    return {
      id: 'novo-endereco-uuid',
      message: 'Endereço adicionado com sucesso',
      endereco: enderecoData
    };
  }

  @Put(':id')
  @Roles(RoleType.USER, RoleType.PARTNER)
  @ApiOperation({
    summary: 'Atualizar endereço',
    description: 'Atualiza um endereço existente do usuário autenticado.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do endereço a ser atualizado',
    example: 'uuid-do-endereco'
  })
  @ApiBody({
    description: 'Dados para atualização do endereço',
    schema: {
      type: 'object',
      properties: {
        apelido: { type: 'string', example: 'Casa' },
        rua: { type: 'string', example: 'Rua das Flores' },
        numero: { type: 'string', example: '123' },
        complemento: { type: 'string', example: 'Apto 45', nullable: true },
        bairro: { type: 'string', example: 'Centro' },
        cidade: { type: 'string', example: 'São Paulo' },
        estado: { type: 'string', example: 'SP' },
        cep: { type: 'string', example: '01234567' },
        principal: { type: 'boolean', example: false }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço atualizado com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Endereço não encontrado'
  })
  @ApiResponse({
    status: 403,
    description: 'Não autorizado para atualizar este endereço'
  })
  atualizarEndereco(@Req() req, @Param('id') id: string, @Body() enderecoData: any) {
    // TODO: Implementar lógica para atualizar endereço
    return {
      message: 'Endereço atualizado com sucesso',
      endereco: { id, ...enderecoData }
    };
  }

  @Delete(':id')
  @Roles(RoleType.USER, RoleType.PARTNER)
  @ApiOperation({
    summary: 'Remover endereço',
    description: 'Remove um endereço do usuário autenticado.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do endereço a ser removido',
    example: 'uuid-do-endereco'
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço removido com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Endereço removido com sucesso' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Endereço não encontrado'
  })
  @ApiResponse({
    status: 403,
    description: 'Não autorizado para remover este endereço'
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover o endereço principal'
  })
  removerEndereco(@Req() req, @Param('id') id: string) {
    // TODO: Implementar lógica para remover endereço
    return {
      message: 'Endereço removido com sucesso'
    };
  }

  @Post(':id/principal')
  @Roles(RoleType.USER, RoleType.PARTNER)
  @ApiOperation({
    summary: 'Definir endereço como principal',
    description: 'Define um endereço como o endereço principal do usuário.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do endereço a ser definido como principal',
    example: 'uuid-do-endereco'
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço definido como principal',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Endereço definido como principal' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Endereço não encontrado'
  })
  @ApiResponse({
    status: 403,
    description: 'Não autorizado para modificar este endereço'
  })
  definirPrincipal(@Req() req, @Param('id') id: string) {
    // TODO: Implementar lógica para definir endereço principal
    return {
      message: 'Endereço definido como principal'
    };
  }
}
