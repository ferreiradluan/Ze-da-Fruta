import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Cupom } from '../../domain/entities/cupom.entity';
import { CupomRepository } from '../../infrastructure/repositories/cupom.repository';
import { EstabelecimentoRepository } from '../../infrastructure/repositories/estabelecimento.repository';

/**
 * CupomService - Serviço para gerenciar cupons
 * Separado do SalesService para manter conformidade com o diagrama DDD
 */
@Injectable()
export class CupomService {
  constructor(
    private readonly cupomRepository: CupomRepository,
    private readonly estabelecimentoRepository: EstabelecimentoRepository,
  ) {}

  async criarCupom(usuario: any, createCupomDto: any): Promise<Cupom> {
    // Validar se usuário tem estabelecimento
    const estabelecimento = await this.estabelecimentoRepository.findByUsuario(usuario.id);
    if (!estabelecimento) {
      throw new ForbiddenException('Usuário não possui estabelecimento');
    }

    const cupom = new Cupom();
    cupom.codigo = createCupomDto.codigo;
    cupom.descricao = createCupomDto.descricao;
    cupom.tipoDesconto = createCupomDto.tipoDesconto;
    cupom.valor = createCupomDto.valor;
    cupom.dataVencimento = createCupomDto.dataVencimento;
    cupom.estabelecimentoId = estabelecimento.id;

    return await this.cupomRepository.save(cupom);
  }

  async listarCupons(usuario: any): Promise<Cupom[]> {
    const estabelecimento = await this.estabelecimentoRepository.findByUsuario(usuario.id);
    if (!estabelecimento) {
      throw new ForbiddenException('Usuário não possui estabelecimento');
    }

    return await this.cupomRepository.findByEstabelecimento(estabelecimento.id);
  }

  async buscarCupomPorCodigo(codigo: string): Promise<Cupom> {
    const cupom = await this.cupomRepository.findByCodigo(codigo);
    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }
    return cupom;
  }

  async atualizarCupom(usuario: any, id: string, updateCupomDto: any): Promise<Cupom> {
    const cupom = await this.cupomRepository.findById(id);
    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }

    // Validar se usuário tem acesso
    const estabelecimento = await this.estabelecimentoRepository.findByUsuario(usuario.id);
    if (!estabelecimento || cupom.estabelecimentoId !== estabelecimento.id) {
      throw new ForbiddenException('Acesso negado');
    }

    Object.assign(cupom, updateCupomDto);
    return await this.cupomRepository.save(cupom);
  }

  async desativarCupom(usuario: any, id: string): Promise<Cupom> {
    const cupom = await this.cupomRepository.findById(id);
    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }

    // Validar se usuário tem acesso
    const estabelecimento = await this.estabelecimentoRepository.findByUsuario(usuario.id);
    if (!estabelecimento || cupom.estabelecimentoId !== estabelecimento.id) {
      throw new ForbiddenException('Acesso negado');
    }

    cupom.ativo = false;
    return await this.cupomRepository.save(cupom);
  }

  async validarCupom(codigo: string, valorPedido: number): Promise<any> {
    const cupom = await this.cupomRepository.findByCodigo(codigo);
    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }

    if (!cupom.ativo) {
      throw new BadRequestException('Cupom inativo');
    }

    if (cupom.dataVencimento && cupom.dataVencimento < new Date()) {
      throw new BadRequestException('Cupom expirado');
    }

    // Calcular desconto usando método do domínio
    const desconto = cupom.calcularDesconto(valorPedido);

    return {
      cupom,
      desconto,
      valorFinal: valorPedido - desconto
    };
  }
}
