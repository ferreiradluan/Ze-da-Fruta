import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getUsuarios() {
    return [{ id: 1, nome: 'Admin' }];
  }
  atualizarStatusUsuario(id: number, statusDto: any) {
    return { id, ...statusDto };
  }
  getSolicitacoesLojas() {
    return [{ id: 1, status: 'pendente' }];
  }
  aprovarSolicitacaoLoja(id: number) {
    return { id, status: 'aprovado' };
  }
  reembolsarPedido(id: number) {
    return { id, status: 'reembolsado' };
  }
  getDashboard() {
    return { vendas: 100, usuarios: 10 };
  }
}
