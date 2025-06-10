import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PartnerOnboardingService } from '../../application/services/partner-onboarding.service';
import { SolicitacaoLojistaDto } from '../dto/solicitacao-lojista.dto';
import { SolicitacaoEntregadorDto } from '../dto/solicitacao-entregador.dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('🤝 Onboarding de Parceiros')
@Controller('parceiros/solicitacoes')
@Public() // Endpoints públicos - sem necessidade de autenticação
export class PartnerOnboardingController {
  constructor(
    private readonly partnerOnboardingService: PartnerOnboardingService
  ) {}

  @Post('loja')
  @ApiOperation({
    summary: 'Solicitar parceria como lojista',
    description: 'Endpoint público para que novos lojistas possam solicitar parceria na plataforma. ' +
                 'Não requer autenticação. Após a submissão, a solicitação será analisada pela equipe administrativa.'
  })
  @ApiBody({ 
    type: SolicitacaoLojistaDto,
    description: 'Dados necessários para solicitação de parceria como lojista'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Solicitação criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-solicitacao' },
        tipo: { type: 'string', example: 'LOJISTA' },
        status: { type: 'string', example: 'PENDENTE' },
        nome: { type: 'string', example: 'João Silva' },
        email: { type: 'string', example: 'joao.silva@email.com' },
        telefone: { type: 'string', example: '(11) 99999-9999' },
        nomeEstabelecimento: { type: 'string', example: 'Hortifruti do João' },
        cnpj: { type: 'string', example: '12345678000123' },
        descricaoNegocio: { type: 'string', example: 'Venda de frutas, verduras e legumes frescos' },
        endereco: { type: 'string', example: 'Rua das Flores' },
        numeroEndereco: { type: 'string', example: '123' },
        bairro: { type: 'string', example: 'Centro' },
        cidade: { type: 'string', example: 'São Paulo' },
        estado: { type: 'string', example: 'SP' },
        cep: { type: 'string', example: '01234567' },
        createdAt: { type: 'string', format: 'date-time' },
        message: { type: 'string', example: 'Solicitação recebida com sucesso! Nossa equipe analisará seu pedido em até 3 dias úteis.' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['CPF deve conter exatamente 11 dígitos', 'E-mail deve ser válido']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Dados já cadastrados',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Já existe uma solicitação com este e-mail' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  async solicitarParceiraLojista(@Body() dados: SolicitacaoLojistaDto) {
    const solicitacao = await this.partnerOnboardingService.criarSolicitacaoLojista(dados);
    
    return {
      ...solicitacao,
      message: 'Solicitação recebida com sucesso! Nossa equipe analisará seu pedido em até 3 dias úteis.'
    };
  }

  @Post('entregador')
  @ApiOperation({
    summary: 'Solicitar parceria como entregador',
    description: 'Endpoint público para que novos entregadores possam solicitar parceria na plataforma. ' +
                 'Não requer autenticação. Após a submissão, a solicitação será analisada pela equipe administrativa.'
  })
  @ApiBody({ 
    type: SolicitacaoEntregadorDto,
    description: 'Dados necessários para solicitação de parceria como entregador'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Solicitação criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-solicitacao' },
        tipo: { type: 'string', example: 'ENTREGADOR' },
        status: { type: 'string', example: 'PENDENTE' },
        nome: { type: 'string', example: 'Maria Oliveira' },
        email: { type: 'string', example: 'maria.oliveira@email.com' },
        telefone: { type: 'string', example: '(11) 88888-8888' },
        tipoVeiculo: { type: 'string', example: 'moto' },
        modeloVeiculo: { type: 'string', example: 'Honda CG 160' },
        placaVeiculo: { type: 'string', example: 'ABC-1234' },
        numeroCNH: { type: 'string', example: '12345678901' },
        endereco: { type: 'string', example: 'Rua das Palmeiras' },
        numeroEndereco: { type: 'string', example: '456' },
        bairro: { type: 'string', example: 'Vila Nova' },
        cidade: { type: 'string', example: 'São Paulo' },
        estado: { type: 'string', example: 'SP' },
        cep: { type: 'string', example: '01234567' },
        createdAt: { type: 'string', format: 'date-time' },
        message: { type: 'string', example: 'Solicitação recebida com sucesso! Nossa equipe analisará seu pedido em até 3 dias úteis.' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['CPF deve conter exatamente 11 dígitos', 'Placa deve estar no formato ABC-1234']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Dados já cadastrados',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Já existe uma solicitação com este CPF' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  async solicitarParceiraEntregador(@Body() dados: SolicitacaoEntregadorDto) {
    const solicitacao = await this.partnerOnboardingService.criarSolicitacaoEntregador(dados);
    
    return {
      ...solicitacao,
      message: 'Solicitação recebida com sucesso! Nossa equipe analisará seu pedido em até 3 dias úteis.'
    };
  }
}
