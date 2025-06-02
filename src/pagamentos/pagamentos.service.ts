import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pagamento } from '../common/entities/pagamento.entity';
import { StripeService } from './stripe.service';

@Injectable()
export class PagamentosService {
  constructor(
    @InjectRepository(Pagamento)
    private readonly pagamentoRepository: Repository<Pagamento>,
    private readonly stripeService: StripeService,
  ) {}

  findAll(): Promise<Pagamento[]> {
    return this.pagamentoRepository.find();
  }

  findOne(id: number): Promise<Pagamento | null> {
    return this.pagamentoRepository.findOneBy({ pagamentoId: id });
  }

  create(pagamento: Partial<Pagamento>): Promise<Pagamento> {
    const newPagamento = this.pagamentoRepository.create(pagamento);
    return this.pagamentoRepository.save(newPagamento);
  }

  async update(id: number, pagamento: Partial<Pagamento>): Promise<Pagamento | null> {
    const existingPagamento = await this.findOne(id);
    if (!existingPagamento) return null;
    Object.assign(existingPagamento, pagamento);
    return this.pagamentoRepository.save(existingPagamento);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.pagamentoRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async updateStatusByStripeId(stripePaymentIntentId: string, status: string): Promise<void> {
    await this.pagamentoRepository.update({ stripePaymentIntentId }, { status });
  }
}