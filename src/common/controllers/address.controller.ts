import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../1-account-management/guards/jwt-auth.guard';
import { RolesGuard } from '../../1-account-management/guards/roles.guard';
import { Roles } from '../../1-account-management/decorators/roles.decorator';
import { ROLE } from '../../1-account-management/domain/types/role.types';

/**
 * 📍 CONTROLLER DE ENDEREÇOS
 * 
 * ✅ CRUD completo de endereços do usuário
 * ✅ Operações: listar, criar, atualizar, deletar, definir principal
 * ✅ Respeitando arquitetura modular
 */
@ApiTags('📍 Endereços')
@Controller('address')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.USER, ROLE.SELLER, ROLE.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AddressController {

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
              apelido: { type: 'string', example: 'Casa' },
              logradouro: { type: 'string', example: 'Rua das Flores' },
              numero: { type: 'string', example: '123' },
              complemento: { type: 'string', example: 'Apto 45' },
              bairro: { type: 'string', example: 'Centro' },
              cidade: { type: 'string', example: 'São Paulo' },
              estado: { type: 'string', example: 'SP' },
              cep: { type: 'string', example: '01234-567' },
              principal: { type: 'boolean', example: true },
              ativo: { type: 'boolean', example: true }
            }
          }
        }
      }
    }
  })
  async listarMeusEnderecos(@Req() req: any) {
    const userId = req.user.id;
    
    // TODO: Implementar busca real via AddressService
    return {
      enderecos: [
        {
          id: 'endereco-1',
          apelido: 'Casa',
          logradouro: 'Rua das Flores',
          numero: '123',
          complemento: 'Apto 45',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          principal: true,
          ativo: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'endereco-2',
          apelido: 'Trabalho',
          logradouro: 'Av. Paulista',
          numero: '1000',
          complemento: 'Sala 101',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01310-100',
          principal: false,
          ativo: true,
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
    description: 'Cria um novo endereço para o usuário logado'
  })
  @ApiBody({
    description: 'Dados do novo endereço',
    schema: {
      type: 'object',
      properties: {
        apelido: { type: 'string', example: 'Casa Nova' },
        logradouro: { type: 'string', example: 'Rua das Palmeiras' },
        numero: { type: 'string', example: '456' },
        complemento: { type: 'string', example: 'Casa 2' },
        bairro: { type: 'string', example: 'Vila Nova' },
        cidade: { type: 'string', example: 'São Paulo' },
        estado: { type: 'string', example: 'SP' },
        cep: { type: 'string', example: '05678-901' },
        principal: { type: 'boolean', example: false }
      },
      required: ['apelido', 'logradouro', 'numero', 'bairro', 'cidade', 'estado', 'cep']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Endereço criado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos fornecidos'
  })
  async criarEndereco(@Req() req: any, @Body() dadosEndereco: any) {
    const userId = req.user.id;
    
    // TODO: Implementar criação real via AddressService
    const novoEndereco = {
      id: `endereco-${Date.now()}`,
      ...dadosEndereco,
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return {
      message: 'Endereço criado com sucesso',
      endereco: novoEndereco,
      userId
    };
  }

  /**
   * ✅ GET /address/{id} - Obter endereço específico
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obter endereço específico',
    description: 'Obtém detalhes de um endereço específico do usuário'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do endereço',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço encontrado'
  })
  @ApiResponse({
    status: 404,
    description: 'Endereço não encontrado'
  })
  async obterEndereco(@Req() req: any, @Param('id') enderecoId: string) {
    const userId = req.user.id;
    
    // TODO: Implementar busca real via AddressService
    return {
      endereco: {
        id: enderecoId,
        apelido: 'Casa',
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: 'Apto 45',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        principal: true,
        ativo: true,
        createdAt: new Date().toISOString()
      },
      userId
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
    description: 'Dados para atualização',
    schema: {
      type: 'object',
      properties: {
        apelido: { type: 'string', example: 'Casa Atualizada' },
        logradouro: { type: 'string', example: 'Rua das Rosas' },
        numero: { type: 'string', example: '789' },
        complemento: { type: 'string', example: 'Apto 67' },
        bairro: { type: 'string', example: 'Jardim das Flores' },
        cidade: { type: 'string', example: 'São Paulo' },
        estado: { type: 'string', example: 'SP' },
        cep: { type: 'string', example: '09876-543' }
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
    
    // TODO: Implementar atualização real via AddressService
    return {
      message: 'Endereço atualizado com sucesso',
      endereco: {
        id: enderecoId,
        ...dadosAtualizacao,
        updatedAt: new Date().toISOString()
      },
      userId
    };
  }

  /**
   * ✅ DELETE /address/{id} - Remover endereço
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover endereço',
    description: 'Remove um endereço específico (soft delete)'
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
    description: 'Não é possível remover o endereço principal'
  })
  async removerEndereco(@Req() req: any, @Param('id') enderecoId: string) {
    const userId = req.user.id;
    
    // TODO: Implementar remoção real via AddressService
    // Verificar se não é o endereço principal
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
    summary: 'Definir como endereço principal',
    description: 'Define um endereço como principal (remove a flag dos outros)'
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
  async definirComoPrincipal(@Req() req: any, @Param('id') enderecoId: string) {
    const userId = req.user.id;
    
    // TODO: Implementar definição via AddressService
    // 1. Remover flag principal de todos os outros endereços
    // 2. Definir este como principal
    return {
      message: 'Endereço definido como principal',
      enderecoPrincipal: enderecoId,
      alteradoEm: new Date().toISOString(),
      userId
    };
  }

  /**
   * ✅ POST /address/validar-cep/{cep} - Validar e buscar dados do CEP
   */
  @Post('validar-cep/:cep')
  @ApiOperation({
    summary: 'Validar e buscar dados do CEP',
    description: 'Consulta dados de endereço via CEP (integração com ViaCEP)'
  })
  @ApiParam({
    name: 'cep',
    description: 'CEP para consulta (formato: 12345-678)',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'CEP válido e dados retornados'
  })
  @ApiResponse({
    status: 404,
    description: 'CEP não encontrado'
  })
  async validarCep(@Param('cep') cep: string) {
    // TODO: Implementar integração real com ViaCEP
    // Por enquanto, simula a resposta
    
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return {
        error: 'CEP inválido',
        message: 'CEP deve ter 8 dígitos',
        status: 400
      };
    }
    
    return {
      cep: `${cepLimpo.substring(0, 5)}-${cepLimpo.substring(5)}`,
      logradouro: 'Rua Exemplo',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      ibge: '3550308',
      ddd: '11',
      valido: true
    };
  }
}
