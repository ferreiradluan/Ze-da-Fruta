import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Categoria } from '../../domain/entities/categoria.entity';
import { CategoriaRepository } from '../../infrastructure/repositories/categoria.repository';
import { EstabelecimentoRepository } from '../../infrastructure/repositories/estabelecimento.repository';

/**
 * CategoriaService - Serviço para gerenciar categorias
 * Separado do SalesService para manter conformidade com o diagrama DDD
 */
@Injectable()
export class CategoriaService {
  constructor(
    private readonly categoriaRepository: CategoriaRepository,
    private readonly estabelecimentoRepository: EstabelecimentoRepository,
  ) {}

  async listarCategorias(): Promise<Categoria[]> {
    return await this.categoriaRepository.findAll();
  }

  async criarCategoria(usuario: any, createCategoriaDto: any): Promise<Categoria> {
    // Validar se usuário tem estabelecimento
    const estabelecimento = await this.estabelecimentoRepository.findByUsuario(usuario.id);
    if (!estabelecimento) {
      throw new ForbiddenException('Usuário não possui estabelecimento');
    }

    const categoria = new Categoria();
    categoria.nome = createCategoriaDto.nome;
    categoria.descricao = createCategoriaDto.descricao;
    categoria.estabelecimentoId = estabelecimento.id;

    return await this.categoriaRepository.save(categoria);
  }

  async atualizarCategoria(usuario: any, id: string, updateData: any): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findById(id);
    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    // Validar se usuário tem acesso
    const estabelecimento = await this.estabelecimentoRepository.findByUsuario(usuario.id);
    if (!estabelecimento || categoria.estabelecimentoId !== estabelecimento.id) {
      throw new ForbiddenException('Acesso negado');
    }

    Object.assign(categoria, updateData);
    return await this.categoriaRepository.save(categoria);
  }

  async excluirCategoria(usuario: any, id: string): Promise<void> {
    const categoria = await this.categoriaRepository.findById(id);
    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    // Validar se usuário tem acesso
    const estabelecimento = await this.estabelecimentoRepository.findByUsuario(usuario.id);
    if (!estabelecimento || categoria.estabelecimentoId !== estabelecimento.id) {
      throw new ForbiddenException('Acesso negado');
    }

    await this.categoriaRepository.delete(id);
  }
}
