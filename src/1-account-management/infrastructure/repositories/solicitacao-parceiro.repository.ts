import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitacaoParceiro } from '../../domain/entities/solicitacao-parceiro.entity';

@Injectable()
export class SolicitacaoParceiroRepository {
  constructor(
    @InjectRepository(SolicitacaoParceiro)
    private readonly repository: Repository<SolicitacaoParceiro>,
  ) {}

  create(data: Partial<SolicitacaoParceiro>): SolicitacaoParceiro {
    return this.repository.create(data);
  }

  async save(solicitacao: SolicitacaoParceiro): Promise<SolicitacaoParceiro> {
    return this.repository.save(solicitacao);
  }

  async findOne(options: any): Promise<SolicitacaoParceiro | null> {
    return this.repository.findOne(options);
  }

  async criar(solicitacao: SolicitacaoParceiro): Promise<SolicitacaoParceiro> {
    return this.repository.save(solicitacao);
  }

  async buscarPorId(id: string): Promise<SolicitacaoParceiro | null> {
    return this.repository.findOne({ where: { id } });
  }

  async buscarPorEmail(email: string): Promise<SolicitacaoParceiro | null> {
    return this.repository.findOne({ where: { email } });
  }

  async buscarPorCpf(cpf: string): Promise<SolicitacaoParceiro | null> {
    return this.repository.createQueryBuilder('solicitacao')
      .where("JSON_EXTRACT(solicitacao.dados, '$.cpf') = :cpf", { cpf })
      .getOne();
  }

  async buscarPorCnpj(cnpj: string): Promise<SolicitacaoParceiro | null> {
    return this.repository.createQueryBuilder('solicitacao')
      .where("JSON_EXTRACT(solicitacao.dados, '$.cnpj') = :cnpj", { cnpj })
      .getOne();
  }

  async buscarPorStatus(status: string): Promise<SolicitacaoParceiro[]> {
    return this.repository.find({ 
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }

  async buscarPorTipo(tipo: string): Promise<SolicitacaoParceiro[]> {
    return this.repository.find({ 
      where: { tipo },
      order: { createdAt: 'DESC' }
    });
  }

  async buscarPorTipoEStatus(tipo: string, status: string): Promise<SolicitacaoParceiro[]> {
    return this.repository.find({ 
      where: { tipo, status },
      order: { createdAt: 'DESC' }
    });
  }

  async listarTodas(): Promise<SolicitacaoParceiro[]> {
    return this.repository.find({ 
      order: { createdAt: 'DESC' }
    });
  }

  async atualizar(solicitacao: SolicitacaoParceiro): Promise<SolicitacaoParceiro> {
    return this.repository.save(solicitacao);
  }

  async contar(): Promise<number> {
    return this.repository.count();
  }

  async contarPorStatus(status: string): Promise<number> {
    return this.repository.count({ where: { status } });
  }

  async contarPorTipo(tipo: string): Promise<number> {
    return this.repository.count({ where: { tipo } });
  }

  async verificarDuplicidade(email: string, cpf: string, cnpj?: string): Promise<boolean> {
    const query = this.repository.createQueryBuilder('solicitacao')
      .where('solicitacao.email = :email', { email })
      .orWhere("JSON_EXTRACT(solicitacao.dados, '$.cpf') = :cpf", { cpf });

    if (cnpj) {
      query.orWhere("JSON_EXTRACT(solicitacao.dados, '$.cnpj') = :cnpj", { cnpj });
    }

    const solicitacaoExistente = await query.getOne();
    return !!solicitacaoExistente;
  }
}
