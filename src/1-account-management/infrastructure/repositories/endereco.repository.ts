import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Endereco } from '../../domain/entities/endereco.entity';

/**
 * Repository para Endereco
 * Camada de Acesso a Dados
 */
@Injectable()
export class EnderecoRepository {
  constructor(
    @InjectRepository(Endereco)
    private readonly repository: Repository<Endereco>,
  ) {}

  async save(endereco: Endereco): Promise<Endereco> {
    return this.repository.save(endereco);
  }

  async findById(id: string): Promise<Endereco | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUsuarioId(usuarioId: string): Promise<Endereco[]> {
    return this.repository.find({
      where: { usuario: { id: usuarioId } },
      order: { principal: 'DESC', createdAt: 'ASC' }
    });
  }

  async findPrincipalByUsuarioId(usuarioId: string): Promise<Endereco | null> {
    return this.repository.findOne({
      where: { 
        usuario: { id: usuarioId },
        principal: true,
        ativo: true
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
  async update(id: string, dadosEndereco: Partial<Endereco>): Promise<Endereco | null> {
    await this.repository.update(id, dadosEndereco);
    return this.findById(id);
  }

  async create(dadosEndereco: Partial<Endereco>): Promise<Endereco> {
    const endereco = this.repository.create(dadosEndereco);
    return endereco;
  }

  async remove(usuarioId: string, enderecoId: string): Promise<void> {
    const endereco = await this.repository.findOne({
      where: { 
        id: enderecoId,
        usuario: { id: usuarioId }
      }
    });
    
    if (endereco) {
      await this.repository.remove(endereco);
    }
  }

  async definirComoPrincipal(usuarioId: string, enderecoId: string): Promise<void> {
    // Remove o status principal de todos os endereços do usuário
    await this.repository.update(
      { usuario: { id: usuarioId } },
      { principal: false }
    );

    // Define o endereço especificado como principal
    await this.repository.update(enderecoId, { principal: true });
  }
}
