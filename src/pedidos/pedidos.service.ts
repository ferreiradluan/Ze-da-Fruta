import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../common/entities/pedido.entity';
import { UsersService } from '../users/users.service';
import { EnderecosService } from '../enderecos/enderecos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    private readonly usersService: UsersService,
    private readonly enderecosService: EnderecosService,
  ) {}

  async create(dto: CreatePedidoDto): Promise<Pedido> {
    // Busca o usuário
    const user = await this.usersService.findById(dto.userId);
    if (!user) throw new BadRequestException('Usuário não encontrado');
    // Busca o endereço
    const endereco = await this.enderecosService.findOne(dto.enderecoId);
    if (!endereco) throw new BadRequestException('Endereço não encontrado');
    // Monta string do endereço de entrega
    const enderecoEntrega = `${endereco.rua}, ${endereco.numero}, ${endereco.cidade} - ${endereco.estado}, ${endereco.cep}`;
    // Cria o pedido
    const pedido = this.pedidoRepository.create({
      user,
      status: 'PENDENTE',
      enderecoEntrega,
      itens: [], // Itens devem ser criados separadamente
    });
    return this.pedidoRepository.save(pedido);
  }

  findAll(): Promise<Pedido[]> {
    return this.pedidoRepository.find();
  }

  findOne(id: number): Promise<Pedido | null> {
    return this.pedidoRepository.findOneBy({ pedidoId: id });
  }

  async update(id: number, pedido: Partial<Pedido>): Promise<Pedido | null> {
    const existingPedido = await this.findOne(id);
    if (!existingPedido) return null;
    Object.assign(existingPedido, pedido);
    return this.pedidoRepository.save(existingPedido);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.pedidoRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}