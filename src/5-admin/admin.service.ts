import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from '../1-account-management/application/services/account.service';
import { SalesService } from '../2-sales/application/services/sales.service';
import { PaymentService } from '../4-payment/application/services/payment.service';
// import { DeliveryService } from '../3-delivery/application/services/delivery.service';
import { AuditLogRepository } from './infrastructure/repositories/audit-log.repository';
import { PlatformSettingRepository } from './infrastructure/repositories/platform-setting.repository';
import { AuditLog } from './domain/entities/audit-log.entity';
import { PlatformSetting } from './domain/entities/platform-setting.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    // Services de outros domínios (conforme diagrama)
    private readonly accountService: AccountService,
    private readonly salesService: SalesService,
    private readonly paymentService: PaymentService,
    // private readonly deliveryService: DeliveryService,
    
    // Repositories próprios do Admin
    private readonly auditLogRepository: AuditLogRepository,
    private readonly platformSettingRepository: PlatformSettingRepository
  ) {}
  /**
   * Aprova solicitação de parceiro (conforme diagrama)
   * Orquestra chamadas para AccountService e SalesService
   */
  async aprovarSolicitacaoParceiro(solicitacaoId: string): Promise<any> {
    this.logger.log(`Aprovando solicitação de parceiro: ${solicitacaoId}`);
    
    // 1. Validar permissões administrativas (futuro)
    // await this.validarPermissoesAdmin(adminId);
    
    // 2. Orquestrar aprovação via AccountService
    // TODO: Implementar método aprovarSolicitacaoParceiro no AccountService
    // const resultado = await this.accountService.aprovarSolicitacaoParceiro(solicitacaoId);
    const resultado = { solicitacaoId, status: 'aprovado', message: 'Método será implementado no AccountService' };
    
    // 3. Registrar auditoria
    await this.registrarAuditoria('APROVAR_PARCEIRO', {
      solicitacaoId,
      resultado
    });
    
    return resultado;
  }
  /**
   * Atualiza status de usuário (conforme diagrama)
   */
  async atualizarStatusUsuario(usuarioId: string, novoStatus: string): Promise<any> {
    this.logger.log(`Atualizando status do usuário: ${usuarioId}`);
    
    // TODO: Implementar método atualizarStatusUsuario no AccountService
    // const resultado = await this.accountService.atualizarStatusUsuario(usuarioId, novoStatus);
    const resultado = { usuarioId, novoStatus, message: 'Método será implementado no AccountService' };
    
    await this.registrarAuditoria('ATUALIZAR_STATUS_USUARIO', {
      usuarioId,
      novoStatus
    });
    
    return resultado;
  }
  /**
   * Inicia reembolso de pedido (conforme diagrama)
   */
  async iniciarReembolsoPedido(pedidoId: string, dados: any): Promise<any> {
    this.logger.log(`Iniciando reembolso do pedido: ${pedidoId}`);
    
    await this.paymentService.iniciarReembolso(pedidoId, dados.valor);
    
    await this.registrarAuditoria('INICIAR_REEMBOLSO', {
      pedidoId,
      dados
    });
    
    return { pedidoId, status: 'reembolso_iniciado', dados };
  }
  /**
   * Cria cupom global (conforme diagrama)
   */
  async criarCupomGlobal(dadosCupom: any): Promise<any> {    this.logger.log('Criando cupom global');
    
    const resultado = await this.salesService.criarCupomGlobal(dadosCupom);
    
    await this.registrarAuditoria('CRIAR_CUPOM_GLOBAL', {
      dadosCupom
    });
    
    return resultado;
  }

  /**
   * Desativa cupom (conforme diagrama)
   */
  async desativarCupom(cupomId: string): Promise<any> {    this.logger.log(`Desativando cupom: ${cupomId}`);
    
    const resultado = await this.salesService.desativarCupom(cupomId);
    
    await this.registrarAuditoria('DESATIVAR_CUPOM', {
      cupomId
    });
    
    return resultado;
  }

  /**
   * Obtém configuração da plataforma (conforme diagrama)
   */
  async obterConfiguracao(chave: string): Promise<string | null> {
    const setting = await this.platformSettingRepository.buscarPorChave(chave);
    return setting?.value || null;
  }

  /**
   * Atualiza configuração da plataforma (conforme diagrama)
   */
  async atualizarConfiguracao(chave: string, novoValor: string): Promise<void> {
    let setting = await this.platformSettingRepository.buscarPorChave(chave);
    
    if (!setting) {
      setting = new PlatformSetting();
      setting.key = chave;
    }
    
    // Usar método do domínio rico
    setting.atualizarValor(novoValor);
    
    await this.platformSettingRepository.salvar(setting);
    
    await this.registrarAuditoria('ATUALIZAR_CONFIGURACAO', {
      chave,
      novoValor
    });
  }

  /**
   * Registra ação de auditoria
   */
  private async registrarAuditoria(acao: string, detalhes: any): Promise<void> {
    const auditLog = new AuditLog();
    auditLog.adminId = 'admin-system'; // TODO: Usar admin logado
    auditLog.acao = acao;
    auditLog.detalhes = detalhes;
    
    await this.auditLogRepository.salvar(auditLog);
  }
}
