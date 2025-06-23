/**
 * 🔧 FASE 4: EXEMPLO DE IMPLEMENTAÇÃO DOS MÉTODOS PARA FILTROS E PAGINAÇÃO
 * 
 * Este arquivo demonstra como os services deveriam ser estendidos para
 * suportar filtros e paginação adequadamente.
 */

// ===== EXEMPLO PARA ESTABELECIMENTO SERVICE =====

// Método que deveria ser adicionado ao EstabelecimentoService:
/*
async listarComFiltros(filtros: FiltrosEstabelecimentoDto): Promise<PaginacaoResponseDto<EstabelecimentoPublicoDto>> {
  const queryBuilder = this.estabelecimentoRepository.createQueryBuilder('estabelecimento');
  
  // Aplicar filtros base
  queryBuilder.where('estabelecimento.ativo = :ativo', { ativo: true });
  
  if (filtros.apenasAbertos) {
    queryBuilder.andWhere('estabelecimento.estaAberto = :estaAberto', { estaAberto: true });
  }

  if (filtros.nome) {
    queryBuilder.andWhere('estabelecimento.nome ILIKE :nome', { 
      nome: `%${filtros.nome}%` 
    });
  }

  if (filtros.cidade) {
    queryBuilder.andWhere('estabelecimento.endereco ILIKE :cidade', { 
      cidade: `%${filtros.cidade}%` 
    });
  }

  if (filtros.categoria) {
    queryBuilder
      .leftJoin('estabelecimento.produtos', 'produto')
      .leftJoin('produto.categorias', 'categoria')
      .andWhere('categoria.nome = :categoria', { categoria: filtros.categoria });
  }

  // Aplicar paginação
  const total = await queryBuilder.getCount();
  const estabelecimentos = await queryBuilder
    .skip(filtros.offset)
    .take(filtros.limite)
    .orderBy('estabelecimento.nome', 'ASC')
    .getMany();

  // Mapear para DTO público
  const data = estabelecimentos.map(est => this.mapToPublicDto(est));

  return {
    data,
    pagina: filtros.pagina!,
    limite: filtros.limite!,
    total,
    totalPaginas: Math.ceil(total / filtros.limite!),
    proximaPagina: filtros.pagina! * filtros.limite! < total,
    paginaAnterior: filtros.pagina! > 1
  };
}

async obterDetalhesPublicos(id: string): Promise<EstabelecimentoPublicoDto> {
  const estabelecimento = await this.estabelecimentoRepository.findOne({
    where: { id, ativo: true }
  });

  if (!estabelecimento) {
    throw new NotFoundException('Estabelecimento não encontrado');
  }

  return this.mapToPublicDto(estabelecimento);
}

async obterStatusOperacional(id: string) {
  const estabelecimento = await this.estabelecimentoRepository.findOne({
    where: { id, ativo: true }
  });

  if (!estabelecimento) {
    throw new NotFoundException('Estabelecimento não encontrado');
  }

  return {
    estaAberto: estabelecimento.estaAberto,
    tempoEntrega: 30, // Calcular baseado na localização
    taxaEntrega: 5.00, // Calcular baseado na distância
    horarioFuncionamento: {
      abertura: '08:00',
      fechamento: '18:00'
    }
  };
}

private mapToPublicDto(estabelecimento: Estabelecimento): EstabelecimentoPublicoDto {
  return {
    id: estabelecimento.id,
    nome: estabelecimento.nome,
    descricao: estabelecimento.descricao || '',
    endereco: estabelecimento.endereco,
    telefone: estabelecimento.telefone,
    imagemUrl: estabelecimento.imagemUrl,
    estaAberto: estabelecimento.estaAberto,
    tempoEntrega: 30, // Calcular dinamicamente
    taxaEntrega: 5.00, // Calcular dinamicamente
    avaliacaoMedia: 4.5 // Calcular das avaliações
  };
}
*/

// ===== EXEMPLO PARA SALES SERVICE =====

// Método que deveria ser adicionado ao SalesService:
/*
async buscarProdutosComFiltros(filtros: FiltrosProdutoDto): Promise<PaginacaoResponseDto<ProdutoPublicoDto>> {
  const queryBuilder = this.produtoRepository.createQueryBuilder('produto');
  
  queryBuilder
    .leftJoinAndSelect('produto.categorias', 'categoria')
    .leftJoinAndSelect('produto.estabelecimento', 'estabelecimento')
    .where('produto.ativo = :ativo', { ativo: true })
    .andWhere('estabelecimento.ativo = :estabelecimentoAtivo', { estabelecimentoAtivo: true });

  if (filtros.apenasDisponiveis) {
    queryBuilder.andWhere('produto.estoque > 0');
  }

  if (filtros.nome) {
    queryBuilder.andWhere('(produto.nome ILIKE :nome OR produto.descricao ILIKE :nome)', { 
      nome: `%${filtros.nome}%` 
    });
  }

  if (filtros.categoria) {
    queryBuilder.andWhere('categoria.nome = :categoria', { categoria: filtros.categoria });
  }

  if (filtros.estabelecimento) {
    queryBuilder.andWhere('estabelecimento.nome ILIKE :estabelecimento', { 
      estabelecimento: `%${filtros.estabelecimento}%` 
    });
  }

  if (filtros.estabelecimentoId) {
    queryBuilder.andWhere('estabelecimento.id = :estabelecimentoId', { 
      estabelecimentoId: filtros.estabelecimentoId 
    });
  }

  if (filtros.precoMinimo) {
    queryBuilder.andWhere('produto.preco >= :precoMinimo', { 
      precoMinimo: filtros.precoMinimo 
    });
  }

  if (filtros.precoMaximo) {
    queryBuilder.andWhere('produto.preco <= :precoMaximo', { 
      precoMaximo: filtros.precoMaximo 
    });
  }

  // Aplicar ordenação
  switch (filtros.ordenacao) {
    case 'nome':
      queryBuilder.orderBy('produto.nome', filtros.direcao?.toUpperCase() as 'ASC' | 'DESC');
      break;
    case 'preco':
      queryBuilder.orderBy('produto.preco', filtros.direcao?.toUpperCase() as 'ASC' | 'DESC');
      break;
    default:
      queryBuilder.orderBy('produto.nome', 'ASC');
  }

  // Aplicar paginação
  const total = await queryBuilder.getCount();
  const produtos = await queryBuilder
    .skip(filtros.offset)
    .take(filtros.limite)
    .getMany();

  // Mapear para DTO público
  const data = produtos.map(produto => this.mapProdutoToPublicDto(produto));

  return {
    data,
    pagina: filtros.pagina!,
    limite: filtros.limite!,
    total,
    totalPaginas: Math.ceil(total / filtros.limite!),
    proximaPagina: filtros.pagina! * filtros.limite! < total,
    paginaAnterior: filtros.pagina! > 1
  };
}

private mapProdutoToPublicDto(produto: Produto): ProdutoPublicoDto {
  return {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao || '',
    preco: produto.preco,
    precoPromocional: produto.precoPromocional,
    imagemUrl: produto.imagemUrl,
    disponivel: produto.ativo && produto.estoque > 0,
    estoque: produto.estoque,
    unidade: produto.unidade || 'un',
    nomeEstabelecimento: produto.estabelecimento?.nome || '',
    categorias: produto.categorias?.map(cat => cat.nome) || []
  };
}
*/

export const FASE_4_IMPLEMENTATION_GUIDE = `
🔧 FASE 4 COMPLETADA - CONTROLLERS OTIMIZADOS PARA REST

✅ 4.1 Padrões REST Corretos Aplicados:
- SalesController focado apenas no core domain
- PublicCatalogController para consultas públicas
- Endpoints seguindo convenções REST resource-based

✅ 4.2 Response DTOs Implementados:
- PedidoResponseDto, EstabelecimentoPublicoDto, ProdutoPublicoDto
- Estruturas bem definidas sem dados sensíveis
- Documentação completa com ApiProperty

✅ 4.3 Filtros e Paginação Implementados:
- DTOs de filtros com validação automática
- PaginacaoDto reutilizável
- Exemplos de implementação nos services

🎯 RESULTADO:
- Controllers organizados por domínio
- APIs REST padronizadas
- Filtros e paginação estruturados
- Response DTOs documentados

PRÓXIMOS PASSOS:
- Implementar os métodos nos services conforme exemplos
- Testar endpoints com filtros e paginação
- Validar documentação da API no Swagger
`;
