import { Injectable } from '@nestjs/common';

@Injectable()
export class DeliveryService {
  getEntregasDisponiveis() {
    return [{ id: 1, status: 'disponivel' }];
  }
  atualizarStatusEntrega(id: number, statusDto: any) {
    return { id, ...statusDto };
  }
  getMinhasEntregas() {
    return [{ id: 1, status: 'em andamento' }];
  }
  atualizarStatusEntregador(statusDto: any) {
    return { ...statusDto, atualizado: true };
  }
  getPerfilEntregador() {
    return { nome: 'Entregador Exemplo' };
  }
  getCarteira() {
    return { saldo: 100 };
  }
  solicitarSaque(saqueDto: any) {
    return { ...saqueDto, status: 'solicitado' };
  }
}
