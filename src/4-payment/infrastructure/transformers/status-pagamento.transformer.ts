import { ValueTransformer } from 'typeorm';
import { StatusPagamento } from '../../domain/value-objects/status-pagamento.vo';

export class StatusPagamentoTransformer implements ValueTransformer {
  to(value: StatusPagamento): string | null {
    return value?.valor || null;
  }

  from(value: string): StatusPagamento | null {
    return value ? StatusPagamento.criar(value) : null;
  }
}
