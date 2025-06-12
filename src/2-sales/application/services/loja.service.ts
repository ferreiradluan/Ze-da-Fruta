import { Injectable, NotFoundException } from '@nestjs/common';
import { Estabelecimento } from '../../domain/entities/estabelecimento.entity';
import { Produto } from '../../domain/entities/produto.entity';
import { EstabelecimentoRepository } from '../../infrastructure/repositories/estabelecimento.repository';
import { ProdutoRepository } from '../../infrastructure/repositories/produto.repository';

/**
 * LojaService - Serviço para gerenciar lojas/estabelecimentos
 * Separado do SalesService para manter conformidade com o diagrama DDD
 */
@Injectable()
export class LojaService {
  constructor(
    private readonly estabelecimentoRepository: EstabelecimentoRepository,
    private readonly produtoRepository: ProdutoRepository,
  ) {}

  async listarLojas(): Promise<Estabelecimento[]> {
    return await this.estabelecimentoRepository.findAll();
  }

  async obterDetalhesLoja(id: string): Promise<Estabelecimento> {
    const estabelecimento = await this.estabelecimentoRepository.findById(id);
    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }
    return estabelecimento;
  }

  async buscarProdutosPublico(filtros: any): Promise<Produto[]> {
    return await this.produtoRepository.findWithFilters(filtros);
  }

  async listarEstabelecimentosPublico(): Promise<Estabelecimento[]> {
    return await this.estabelecimentoRepository.findPublic();
  }
}
