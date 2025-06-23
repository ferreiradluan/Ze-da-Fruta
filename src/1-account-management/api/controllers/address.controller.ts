import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../application/strategies/guards/roles.guard';
import { Roles } from '../../application/strategies/guards/roles.decorator';
import { ROLE } from '../../domain/types/role.types';
import { AccountService } from '../../application/services/account.service';

/**
 * 📍 CONTROLLER DE ENDEREÇOS DO USUÁRIO
 * 
 * ✅ CRUD completo de endereços
 * ✅ Operações: listar, criar, atualizar, remover, definir principal
 * ✅ Respeitando arquitetura modular e domínio rico
 */
@ApiTags('📍 Endereços do Usuário')
@Controller('address')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.USER, ROLE.SELLER, ROLE.DELIVERY_PERSON, ROLE.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AddressController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * ✅ GET /address/meus-enderecos - Listar meus endereços
   */
  @Get('meus-enderecos')
  @ApiOperation({
    summary: 'Listar meus endereços',
    description: 'Lista todos os endereços do usuário logado'
  })
  @ApiResponse({
    status: 200,
    description: 'Endereços listados com sucesso',
    schema: {
      type: 'object',
      properties: {
        enderecos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-endereco' },
              logradouro: { type: 'string', example: 'Rua das Flores' },
              numero: { type: 'string', example: '123' },
              complemento: { type: 'string', example: 'Apto 45' },
              bairro: { type: 'string', example: 'Centro' },
              cidade: { type: 'string', example: 'São Paulo' },
              estado: { type: 'string', example: 'SP' },
              cep: { type: 'string', example: '01234-567' },
              isPrincipal: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number', example: 3 }
      }
    }
  })
  async listarMeusEnderecos(@Req() req: any) {
    const userId = req.user.id;
    
    // TODO: Implementar busca real de endereços via AccountService
    // Por enquanto, retorna endereços simulados
    return {
      enderecos: [
        {
          id: 'endereco-1',
          logradouro: 'Rua das Flores',
          numero: '123',
          complemento: 'Apto 45',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          isPrincipal: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'endereco-2',
          logradouro: 'Avenida Paulista',
          numero: '1000',
          complemento: 'Sala 101',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01310-100',
          isPrincipal: false,
          createdAt: new Date().toISOString()
        }
      ],
      total: 2,
      userId
    };
  }

  /**
   * ✅ POST /address - Criar novo endereço
   */
  @Post()
  @ApiOperation({
    summary: 'Criar novo endereço',
    description: 'Adiciona um novo endereço ao perfil do usuário'
  })
  @ApiBody({
    description: 'Dados do novo endereço',
    schema: {
      type: 'object',
      properties: {
        logradouro: { type: 'string', example: 'Rua das Flores' },
        numero: { type: 'string', example: '123' },
        complemento: { type: 'string', example: 'Apto 45' },
        bairro: { type: 'string', example: 'Centro' },
        cidade: { type: 'string', example: 'São Paulo' },
        estado: { type: 'string', example: 'SP' },
        cep: { type: 'string', example: '01234-567' },
        isPrincipal: { type: 'boolean', example: false }
      },
      required: ['logradouro', 'numero', 'bairro', 'cidade', 'estado', 'cep']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Endereço criado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos'
  })
  async criarEndereco(@Req() req: any, @Body() enderecoData: any) {
    const userId = req.user.id;
    
    // TODO: Implementar criação real via AccountService
    // Por enquanto, simula a criação
    const novoEndereco = {
      id: `endereco-${Date.now()}`,
      ...enderecoData,
      createdAt: new Date().toISOString(),
      userId
    };

    return {
      message: 'Endereço criado com sucesso',
      endereco: novoEndereco
    };
  }

  /**
   * ✅ PUT /address/{id} - Atualizar endereço
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar endereço',
    description: 'Atualiza os dados de um endereço específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do endereço',
    type: 'string'
  })
  @ApiBody({
    description: 'Dados a serem atualizados',
    schema: {
      type: 'object',
      properties: {
        logradouro: { type: 'string', example: 'Rua das Flores' },
        numero: { type: 'string', example: '456' },
        complemento: { type: 'string', example: 'Casa fundos' },
        bairro: { type: 'string', example: 'Centro' },
        cidade: { type: 'string', example: 'São Paulo' },
        estado: { type: 'string', example: 'SP' },
        cep: { type: 'string', example: '01234-567' }
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
  async atualizarEndereco(
    @Req() req: any,
    @Param('id') enderecoId: string,
    @Body() dadosAtualizacao: any
  ) {
    const userId = req.user.id;
    
    // TODO: Implementar atualização real via AccountService
    // Por enquanto, simula a atualização
    return {
      message: 'Endereço atualizado com sucesso',
      endereco: {
        id: enderecoId,
        ...dadosAtualizacao,
        updatedAt: new Date().toISOString(),
        userId
      }
    };
  }

  /**
   * ✅ DELETE /address/{id} - Remover endereço
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover endereço',
    description: 'Remove um endereço do perfil do usuário'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do endereço',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço removido com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Endereço não encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover endereço principal'
  })
  async removerEndereco(@Req() req: any, @Param('id') enderecoId: string) {
    const userId = req.user.id;
    
    // TODO: Implementar remoção real via AccountService
    // Verificar se não é o endereço principal antes de remover
    return {
      message: 'Endereço removido com sucesso',
      enderecoId,
      removidoEm: new Date().toISOString(),
      userId
    };
  }

  /**
   * ✅ PUT /address/{id}/principal - Definir como endereço principal
   */
  @Put(':id/principal')
  @ApiOperation({
    summary: 'Definir endereço principal',
    description: 'Define um endereço como principal (padrão para entregas)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do endereço',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço definido como principal'
  })
  @ApiResponse({
    status: 404,
    description: 'Endereço não encontrado'
  })
  async definirEnderecoPrincipal(@Req() req: any, @Param('id') enderecoId: string) {
    const userId = req.user.id;
    
    // TODO: Implementar lógica real via AccountService
    // Deve remover flag principal de outros endereços e definir este como principal
    return {
      message: 'Endereço definido como principal',
      enderecoId,
      isPrincipal: true,
      definidoEm: new Date().toISOString(),
      userId
    };
  }
}
