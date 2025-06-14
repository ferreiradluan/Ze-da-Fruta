import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Estabelecimento } from '../../domain/entities/estabelecimento.entity';
import { EstabelecimentoRepository } from '../../infrastructure/repositories/estabelecimento.repository';
import { FiltrosEstabelecimentoDto } from '../../api/dto/filters/index';
import { EstabelecimentoPublicoDto, PaginacaoResponseDto } from '../../api/dto/responses/index';

/**
 * 🔧 FASE 3: ESTABELECIMENTOSERVICE REFATORADO PARA ORQUESTRAÇÃO PURA
 * 🔧 FASE 4: ADICIONADO FILTROS E PAGINAÇÃO
 * 
 * ✅ APENAS persistência e consultas
 * ✅ Lógica de negócio está na entidade Estabelecimento
 * ✅ Filtros e paginação para endpoints públicos
 */
@Injectable()
export class EstabelecimentoService {
  constructor(
    @InjectRepository(Estabelecimento)
    private estabelecimentoRepository: Repository<Estabelecimento>,
    private readonly estabelecimentoRepo: EstabelecimentoRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}  /**
   * ✅ APENAS consulta
   */
  async listarEstabelecimentosPublico(): Promise<Estabelecimento[]> {
    return this.estabelecimentoRepository.find({
      where: { ativo: true },
      select: [
        'id',
        'nome',
        'descricao',
        'endereco',
        'telefone',
        'imagemUrl',
        'estaAberto',
      ],
      order: { nome: 'ASC' },
    });
  }

  /**
   * ✅ APENAS consulta
   */
  async obterDetalhesLoja(id: string): Promise<Estabelecimento> {
    const loja = await this.estabelecimentoRepository.findOne({
      where: { id, ativo: true },
      relations: ['produtos', 'produtos.categoria'],
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada');
    }

    return loja;
  }

  /**
   * ✅ APENAS consulta
   */
  async obterEstabelecimentoComProdutos(id: string): Promise<Estabelecimento> {
    const estabelecimento = await this.estabelecimentoRepository.findOne({
      where: { id, ativo: true },
      relations: ['produtos'],
    });

    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return estabelecimento;
  }

  /**
   * ✅ APENAS consulta com filtros
   */
  async buscarEstabelecimentosPorFiltros(filtros: any): Promise<Estabelecimento[]> {
    const queryBuilder = this.estabelecimentoRepository.createQueryBuilder('estabelecimento');
    
    queryBuilder.where('estabelecimento.ativo = :ativo', { ativo: true });

    if (filtros.nome) {
      queryBuilder.andWhere('estabelecimento.nome LIKE :nome', { 
        nome: `%${filtros.nome}%` 
      });
    }

    if (filtros.categoria) {
      queryBuilder
        .leftJoin('estabelecimento.produtos', 'produto')
        .leftJoin('produto.categoria', 'categoria')
        .andWhere('categoria.nome = :categoria', { categoria: filtros.categoria });
    }

    return queryBuilder
      .orderBy('estabelecimento.nome', 'ASC')
      .getMany();
  }
  /**
   * ✅ Orquestração com lógica na entidade
   */
  async abrirEstabelecimento(estabelecimentoId: string): Promise<Estabelecimento> {
    const estabelecimento = await this.estabelecimentoRepository.findOne({
      where: { id: estabelecimentoId },
    });

    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    // Lógica na entidade
    estabelecimento.abrir();
    
    await this.estabelecimentoRepository.save(estabelecimento);
    
    // Publicar eventos (se a entidade implementar)
    // await this.publishDomainEvents(estabelecimento);
    
    return estabelecimento;
  }

  /**
   * ✅ Orquestração com lógica na entidade
   */
  async fecharEstabelecimento(estabelecimentoId: string): Promise<Estabelecimento> {
    const estabelecimento = await this.estabelecimentoRepository.findOne({
      where: { id: estabelecimentoId },
    });

    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    // Lógica na entidade
    estabelecimento.fechar();
    
    await this.estabelecimentoRepository.save(estabelecimento);
    
    // Publicar eventos (se a entidade implementar)
    // await this.publishDomainEvents(estabelecimento);
    
    return estabelecimento;
  }
  /**
   * ✅ APENAS persistência - lógica na entidade
   */
  async criarEstabelecimento(dados: any): Promise<Estabelecimento> {
    // Factory method seria na entidade se tivéssemos
    const novoEstabelecimento = new Estabelecimento();
    Object.assign(novoEstabelecimento, dados);
    
    await this.estabelecimentoRepository.save(novoEstabelecimento);
    
    // Publicar eventos de domínio (se a entidade implementar)
    // await this.publishDomainEvents(novoEstabelecimento);
    
    return novoEstabelecimento;
  }

  /**
   * ✅ Helper para publicar eventos de domínio
   */
  private async publishDomainEvents(entity: { getDomainEvents?(): any[]; clearDomainEvents?(): void }): Promise<void> {
    const eventos = entity.getDomainEvents?.();
    if (eventos) {
      for (const evento of eventos) {
        this.eventEmitter.emit(evento.eventName, evento);
      }
      entity.clearDomainEvents?.();
    }
  }

  // ===== FASE 4: MÉTODOS COM FILTROS E PAGINAÇÃO =====

  /**
   * ✅ FASE 4: Listar estabelecimentos com filtros e paginação
   */
  async listarComFiltros(filtros: FiltrosEstabelecimentoDto): Promise<PaginacaoResponseDto<EstabelecimentoPublicoDto>> {
    const queryBuilder = this.estabelecimentoRepository.createQueryBuilder('estabelecimento');
    
    // Filtros base
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

  /**
   * ✅ FASE 4: Obter detalhes públicos de um estabelecimento
   */
  async obterDetalhesPublicos(id: string): Promise<EstabelecimentoPublicoDto> {
    const estabelecimento = await this.estabelecimentoRepository.findOne({
      where: { id, ativo: true }
    });

    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return this.mapToPublicDto(estabelecimento);
  }

  /**
   * ✅ FASE 4: Obter status operacional do estabelecimento
   */
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

  /**
   * ✅ FASE 4: Mapear entidade para DTO público
   */
  private mapToPublicDto(estabelecimento: Estabelecimento): EstabelecimentoPublicoDto {
    return {
      id: estabelecimento.id,
      nome: estabelecimento.nome,
      descricao: estabelecimento.descricao || '',
      endereco: estabelecimento.endereco,
      telefone: estabelecimento.telefone || undefined,
      imagemUrl: estabelecimento.imagemUrl || undefined,
      estaAberto: estabelecimento.estaAberto,
      tempoEntrega: 30, // Calcular dinamicamente
      taxaEntrega: 5.00, // Calcular dinamicamente
      avaliacaoMedia: undefined // Implementar avaliações futuramente
    };
  }

  // ===== MÉTODOS EXISTENTES =====

  /**
   * ✅ APENAS consulta
   */
  async listarEstabelecimentosPublico(): Promise<Estabelecimento[]> {
    return this.estabelecimentoRepository.find({
      where: { ativo: true },
      select: [
        'id',
        'nome',
        'descricao',
        'endereco',
        'telefone',
        'imagemUrl',
        'estaAberto',
      ],
      order: { nome: 'ASC' },
    });
  }

  /**
   * ✅ APENAS consulta
   */
  async obterDetalhesLoja(id: string): Promise<Estabelecimento> {
    const loja = await this.estabelecimentoRepository.findOne({
      where: { id, ativo: true },
      relations: ['produtos', 'produtos.categoria'],
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada');
    }

    return loja;
  }

  /**
   * ✅ APENAS consulta
   */
  async obterEstabelecimentoComProdutos(id: string): Promise<Estabelecimento> {
    const estabelecimento = await this.estabelecimentoRepository.findOne({
      where: { id, ativo: true },
      relations: ['produtos'],
    });

    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return estabelecimento;
  }

  /**
   * ✅ APENAS consulta com filtros
   */
  async buscarEstabelecimentosPorFiltros(filtros: any): Promise<Estabelecimento[]> {
    const queryBuilder = this.estabelecimentoRepository.createQueryBuilder('estabelecimento');
    
    queryBuilder.where('estabelecimento.ativo = :ativo', { ativo: true });

    if (filtros.nome) {
      queryBuilder.andWhere('estabelecimento.nome LIKE :nome', { 
        nome: `%${filtros.nome}%` 
      });
    }

    if (filtros.categoria) {
      queryBuilder
        .leftJoin('estabelecimento.produtos', 'produto')
        .leftJoin('produto.categoria', 'categoria')
        .andWhere('categoria.nome = :categoria', { categoria: filtros.categoria });
    }

    return queryBuilder
      .orderBy('estabelecimento.nome', 'ASC')
      .getMany();
  }
  /**
   * ✅ Orquestração com lógica na entidade
   */
  async abrirEstabelecimento(estabelecimentoId: string): Promise<Estabelecimento> {
    const estabelecimento = await this.estabelecimentoRepository.findOne({
      where: { id: estabelecimentoId },
    });

    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    // Lógica na entidade
    estabelecimento.abrir();
    
    await this.estabelecimentoRepository.save(estabelecimento);
    
    // Publicar eventos (se a entidade implementar)
    // await this.publishDomainEvents(estabelecimento);
    
    return estabelecimento;
  }

  /**
   * ✅ Orquestração com lógica na entidade
   */
  async fecharEstabelecimento(estabelecimentoId: string): Promise<Estabelecimento> {
    const estabelecimento = await this.estabelecimentoRepository.findOne({
      where: { id: estabelecimentoId },
    });

    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    // Lógica na entidade
    estabelecimento.fechar();
    
    await this.estabelecimentoRepository.save(estabelecimento);
    
    // Publicar eventos (se a entidade implementar)
    // await this.publishDomainEvents(estabelecimento);
    
    return estabelecimento;
  }
  /**
   * ✅ APENAS persistência - lógica na entidade
   */
  async criarEstabelecimento(dados: any): Promise<Estabelecimento> {
    // Factory method seria na entidade se tivéssemos
    const novoEstabelecimento = new Estabelecimento();
    Object.assign(novoEstabelecimento, dados);
    
    await this.estabelecimentoRepository.save(novoEstabelecimento);
    
    // Publicar eventos de domínio (se a entidade implementar)
    // await this.publishDomainEvents(novoEstabelecimento);
    
    return novoEstabelecimento;
  }

  /**
   * ✅ Helper para publicar eventos de domínio
   */
  private async publishDomainEvents(entity: { getDomainEvents?(): any[]; clearDomainEvents?(): void }): Promise<void> {
    const eventos = entity.getDomainEvents?.();
    if (eventos) {
      for (const evento of eventos) {
        this.eventEmitter.emit(evento.eventName, evento);
      }
      entity.clearDomainEvents?.();
    }
  }

  // ===== FASE 4: MÉTODOS COM FILTROS E PAGINAÇÃO =====

  /**
   * ✅ FASE 4: Listar estabelecimentos com filtros e paginação
   */
  async listarComFiltros(filtros: FiltrosEstabelecimentoDto): Promise<PaginacaoResponseDto<EstabelecimentoPublicoDto>> {
    const queryBuilder = this.estabelecimentoRepository.createQueryBuilder('estabelecimento');
    
    // Filtros base
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

  /**
   * ✅ FASE 4: Obter detalhes públicos de um estabelecimento
   */
  async obterDetalhesPublicos(id: string): Promise<EstabelecimentoPublicoDto> {
    const estabelecimento = await this.estabelecimentoRepository.findOne({
      where: { id, ativo: true }
    });

    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return this.mapToPublicDto(estabelecimento);
  }

  /**
   * ✅ FASE 4: Obter status operacional do estabelecimento
   */
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

  /**
   * ✅ FASE 4: Mapear entidade para DTO público
   */
  private mapToPublicDto(estabelecimento: Estabelecimento): EstabelecimentoPublicoDto {
    return {
      id: estabelecimento.id,
      nome: estabelecimento.nome,
      descricao: estabelecimento.descricao || '',
      endereco: estabelecimento.endereco,
      telefone: estabelecimento.telefone || undefined,
      imagemUrl: estabelecimento.imagemUrl || undefined,
      estaAberto: estabelecimento.estaAberto,
      tempoEntrega: 30, // Calcular dinamicamente
      taxaEntrega: 5.00, // Calcular dinamicamente
      avaliacaoMedia: undefined // Implementar avaliações futuramente
    };
  }
}
