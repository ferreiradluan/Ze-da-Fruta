import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitacaoParceiro } from '../../domain/entities/solicitacao-parceiro.entity';
import { StatusSolicitacao } from '../../domain/enums/status-solicitacao.enum';
import { TipoSolicitacao } from '../../domain/enums/tipo-solicitacao.enum';

@Injectable()
export class SolicitacaoParceiroRepository {
  constructor(
    @InjectRepository(SolicitacaoParceiro)
    private readonly repository: Repository<SolicitacaoParceiro>,
  ) {}

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
    return this.repository.findOne({ where: { cpf } });
  }

  async buscarPorCnpj(cnpj: string): Promise<SolicitacaoParceiro | null> {
    return this.repository.findOne({ where: { cnpj } });
  }

  async buscarPorStatus(status: StatusSolicitacao): Promise<SolicitacaoParceiro[]> {
    return this.repository.find({ 
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }

  async buscarPorTipo(tipo: TipoSolicitacao): Promise<SolicitacaoParceiro[]> {
    return this.repository.find({ 
      where: { tipo },
      order: { createdAt: 'DESC' }
    });
  }

  async buscarPorTipoEStatus(tipo: TipoSolicitacao, status: StatusSolicitacao): Promise<SolicitacaoParceiro[]> {
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

  async contarPorStatus(status: StatusSolicitacao): Promise<number> {
    return this.repository.count({ where: { status } });
  }

  async contarPorTipo(tipo: TipoSolicitacao): Promise<number> {
    return this.repository.count({ where: { tipo } });
  }

  async verificarDuplicidade(email: string, cpf: string, cnpj?: string): Promise<boolean> {
    const condicoes: any[] = [
      { email },
      { cpf }
    ];

    if (cnpj) {
      condicoes.push({ cnpj });
    }

    const solicitacaoExistente = await this.repository.findOne({
      where: condicoes
    });

    return !!solicitacaoExistente;
  }
}
