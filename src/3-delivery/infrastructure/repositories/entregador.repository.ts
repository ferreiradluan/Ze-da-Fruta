import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Entregador, StatusEntregador, StatusDisponibilidade, TipoVeiculo } from '../../domain/entities/entregador.entity';
import { EnderecoVO } from '../../domain/value-objects/endereco.vo';
import { IEntregadorRepository } from '../../domain/repositories/entregador.repository.interface';

@Injectable()
export class EntregadorRepository implements IEntregadorRepository {
  constructor(
    @InjectRepository(Entregador)
    private readonly repository: Repository<Entregador>,
  ) {}

  async buscarPorId(id: string): Promise<Entregador | null> {
    return this.repository.findOne({ where: { id } });
  }

  async buscarPorEmail(email: string): Promise<Entregador | null> {
    return this.repository.findOne({ where: { email } });
  }

  async buscarPorTelefone(telefone: string): Promise<Entregador | null> {
    return this.repository.findOne({ where: { telefone } });
  }

  async buscarDisponiveis(): Promise<Entregador[]> {
    return this.repository.find({
      where: {
        status: StatusEntregador.ATIVO,
        disponibilidade: StatusDisponibilidade.DISPONIVEL
      },
      order: { avaliacaoMedia: 'DESC', totalEntregasCompletas: 'DESC' }
    });
  }

  async buscarProximosAoEndereco(endereco: EnderecoVO, raioKm: number = 10): Promise<Entregador[]> {
    // Para simplificar, buscar entregadores disponíveis na mesma cidade
    // Em produção, implementaria busca geográfica real
    const entregadoresDisponiveis = await this.buscarDisponiveis();
    
    // Filtrar por localização se disponível
    return entregadoresDisponiveis.filter(entregador => {
      if (!entregador.localizacaoAtual) return true; // Se não tem localização, incluir
      
      // Aqui implementaria cálculo de distância real baseado em lat/lng
      // Por simplicidade, incluindo todos os disponíveis
      return true;
    });
  }

  async buscarPorStatus(status: StatusEntregador): Promise<Entregador[]> {
    return this.repository.find({
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }

  async buscarPorDisponibilidade(disponibilidade: StatusDisponibilidade): Promise<Entregador[]> {
    return this.repository.find({
      where: { disponibilidade },
      order: { ultimaAtividade: 'DESC' }
    });
  }

  async salvar(entregador: Entregador): Promise<Entregador> {
    return this.repository.save(entregador);
  }

  async listarTodos(): Promise<Entregador[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async buscarAtivos(): Promise<Entregador[]> {
    return this.repository.find({
      where: { status: StatusEntregador.ATIVO },
      order: { avaliacaoMedia: 'DESC' }
    });
  }

  async buscarComAvaliacaoMinima(avaliacaoMinima: number): Promise<Entregador[]> {
    return this.repository
      .createQueryBuilder('entregador')
      .where('entregador.avaliacaoMedia >= :avaliacaoMinima', { avaliacaoMinima })
      .andWhere('entregador.status = :status', { status: StatusEntregador.ATIVO })
      .orderBy('entregador.avaliacaoMedia', 'DESC')
      .getMany();
  }

  async buscarPorTipoVeiculo(tipoVeiculo: string): Promise<Entregador[]> {
    return this.repository
      .createQueryBuilder('entregador')
      .where("JSON_EXTRACT(entregador.veiculo, '$.tipo') = :tipoVeiculo", { tipoVeiculo })
      .andWhere('entregador.status = :status', { status: StatusEntregador.ATIVO })
      .orderBy('entregador.avaliacaoMedia', 'DESC')
      .getMany();
  }

  async buscarComLocalizacaoAtualizada(): Promise<Entregador[]> {
    const quinzeMinutosAtras = new Date(Date.now() - 15 * 60 * 1000);
    
    return this.repository
      .createQueryBuilder('entregador')
      .where('entregador.localizacaoAtual IS NOT NULL')
      .andWhere("JSON_EXTRACT(entregador.localizacaoAtual, '$.atualizadoEm') > :limite", { 
        limite: quinzeMinutosAtras.toISOString() 
      })
      .andWhere('entregador.status = :status', { status: StatusEntregador.ATIVO })
      .orderBy('entregador.ultimaAtividade', 'DESC')
      .getMany();
  }

  async buscarInativosHaMais(horas: number): Promise<Entregador[]> {
    const limiteInatividade = new Date(Date.now() - horas * 60 * 60 * 1000);
    
    return this.repository.find({
      where: {
        ultimaAtividade: LessThan(limiteInatividade),
        status: StatusEntregador.ATIVO
      },
      order: { ultimaAtividade: 'ASC' }
    });
  }

  async remover(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async emailExiste(email: string, excludeId?: string): Promise<boolean> {
    const query = this.repository.createQueryBuilder('entregador')
      .where('entregador.email = :email', { email });
    
    if (excludeId) {
      query.andWhere('entregador.id != :excludeId', { excludeId });
    }
    
    const count = await query.getCount();
    return count > 0;
  }

  async telefoneExiste(telefone: string, excludeId?: string): Promise<boolean> {
    const query = this.repository.createQueryBuilder('entregador')
      .where('entregador.telefone = :telefone', { telefone });
    
    if (excludeId) {
      query.andWhere('entregador.id != :excludeId', { excludeId });
    }
    
    const count = await query.getCount();
    return count > 0;
  }

  async contarAtivos(): Promise<number> {
    return this.repository.count({
      where: { status: StatusEntregador.ATIVO }
    });
  }

  async buscarComEstatisticas(): Promise<Entregador[]> {
    return this.repository
      .createQueryBuilder('entregador')
      .where('entregador.status = :status', { status: StatusEntregador.ATIVO })
      .andWhere('entregador.totalEntregas > 0')
      .orderBy('entregador.avaliacaoMedia', 'DESC')
      .addOrderBy('entregador.totalEntregasCompletas', 'DESC')
      .getMany();
  }
}
