import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('solicitacoes/loja')
@ApiTags('solicitacoes-loja')
export class SolicitacoesLojaController {
  @Post()
  @ApiOperation({ summary: 'Solicitar abertura de nova loja' })
  @ApiResponse({ status: 201, description: 'Solicitação criada com sucesso' })
  async solicitarLoja(@Body() solicitacaoDto: any) {
    // TODO: Implementar lógica para criar solicitação de loja
    // Exemplo de resposta:
    // return { id: 1, ...solicitacaoDto };
    return { message: 'Solicitação de loja recebida.' };
  }
}
