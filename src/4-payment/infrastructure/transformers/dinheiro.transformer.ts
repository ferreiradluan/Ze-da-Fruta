import { ValueTransformer } from 'typeorm';
import { Dinheiro } from '../../domain/value-objects/dinheiro.vo';

export class DinheiroTransformer implements ValueTransformer {
  to(value: Dinheiro): number {
    return value?.valor || 0;
  }

  from(value: number): Dinheiro | null {
    return value !== null ? new Dinheiro(value) : null;
  }
}
