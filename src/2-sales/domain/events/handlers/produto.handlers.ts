import { BaseDomainEventHandler } from '../../../../common/domain/events/handlers/domain-event-handler.interface';
import { 
  ProdutoEstoqueAlteradoEvent,
  ProdutoEstoqueCriticoEvent,
  ProdutoPrecoAlteradoEvent,
  ProdutoCriadoEvent,
  ProdutoDesativadoEvent
} from '../produto.events';

/**
 * Handler for Produto Criado Event
 */
export class ProdutoCriadoHandler extends BaseDomainEventHandler<ProdutoCriadoEvent> {
  getEventName(): string {
    return 'produto.criado';
  }

  async handle(event: ProdutoCriadoEvent): Promise<void> {
    try {
      this.logEvent(event, 'Processing product creation');

      // Business logic for product creation
      await this.indexarProdutoParaBusca(event);
      await this.atualizarCatalogo(event);
      await this.notificarSistemaRecomendacao(event);
      
      this.logEvent(event, 'Product creation processed successfully');
    } catch (error) {
      this.handleError(event, error);
      throw error;
    }
  }

  private async indexarProdutoParaBusca(event: ProdutoCriadoEvent): Promise<void> {
    console.log(`Indexing product for search: ${event.aggregateId}`);
  }

  private async atualizarCatalogo(event: ProdutoCriadoEvent): Promise<void> {
    console.log(`Updating catalog with new product: ${event.aggregateId}`);
  }

  private async notificarSistemaRecomendacao(event: ProdutoCriadoEvent): Promise<void> {
    console.log(`Notifying recommendation system: ${event.aggregateId}`);
  }
}

/**
 * Handler for Produto Estoque Alterado Event
 */
export class ProdutoEstoqueAlteradoHandler extends BaseDomainEventHandler<ProdutoEstoqueAlteradoEvent> {
  getEventName(): string {
    return 'produto.estoque.alterado';
  }

  async handle(event: ProdutoEstoqueAlteradoEvent): Promise<void> {
    try {
      this.logEvent(event, 'Processing stock change');

      // Business logic for stock change
      await this.atualizarDisponibilidade(event);
      await this.verificarEstoqueCritico(event);
      await this.sincronizarComERP(event);
      
      this.logEvent(event, 'Stock change processed successfully');
    } catch (error) {
      this.handleError(event, error);
      throw error;
    }
  }

  private async atualizarDisponibilidade(event: ProdutoEstoqueAlteradoEvent): Promise<void> {
    console.log(`Updating availability for product: ${event.aggregateId}`);
  }

  private async verificarEstoqueCritico(event: ProdutoEstoqueAlteradoEvent): Promise<void> {
    const payload = event.getPayload();
    if (payload.estoqueAnterior > payload.novoEstoque && payload.novoEstoque <= payload.estoqueCritico) {
      console.log(`Product ${event.aggregateId} reached critical stock level`);
      // Here we could dispatch a new ProdutoEstoqueCriticoEvent
    }
  }

  private async sincronizarComERP(event: ProdutoEstoqueAlteradoEvent): Promise<void> {
    console.log(`Synchronizing stock with ERP for product: ${event.aggregateId}`);
  }
}

/**
 * Handler for Produto Estoque Crítico Event
 */
export class ProdutoEstoqueCriticoHandler extends BaseDomainEventHandler<ProdutoEstoqueCriticoEvent> {
  getEventName(): string {
    return 'produto.estoque.critico';
  }

  async handle(event: ProdutoEstoqueCriticoEvent): Promise<void> {
    try {
      this.logEvent(event, 'Processing critical stock alert');

      // Business logic for critical stock
      await this.alertarGerentes(event);
      await this.criarPedidoReposicao(event);
      await this.atualizarStatusDisponibilidade(event);
      
      this.logEvent(event, 'Critical stock alert processed successfully');
    } catch (error) {
      this.handleError(event, error);
      throw error;
    }
  }

  private async alertarGerentes(event: ProdutoEstoqueCriticoEvent): Promise<void> {
    console.log(`Alerting managers about critical stock for product: ${event.aggregateId}`);
  }

  private async criarPedidoReposicao(event: ProdutoEstoqueCriticoEvent): Promise<void> {
    console.log(`Creating replenishment order for product: ${event.aggregateId}`);
  }

  private async atualizarStatusDisponibilidade(event: ProdutoEstoqueCriticoEvent): Promise<void> {
    console.log(`Updating availability status for product: ${event.aggregateId}`);
  }
}

/**
 * Handler for Produto Preço Alterado Event
 */
export class ProdutoPrecoAlteradoHandler extends BaseDomainEventHandler<ProdutoPrecoAlteradoEvent> {
  getEventName(): string {
    return 'produto.preco.alterado';
  }

  async handle(event: ProdutoPrecoAlteradoEvent): Promise<void> {
    try {
      this.logEvent(event, 'Processing price change');

      // Business logic for price change
      await this.atualizarSistemaPromocoes(event);
      await this.recalcularPedidosAtivos(event);
      await this.notificarClientesInteressados(event);
      
      this.logEvent(event, 'Price change processed successfully');
    } catch (error) {
      this.handleError(event, error);
      throw error;
    }
  }

  private async atualizarSistemaPromocoes(event: ProdutoPrecoAlteradoEvent): Promise<void> {
    console.log(`Updating promotion system for product: ${event.aggregateId}`);
  }

  private async recalcularPedidosAtivos(event: ProdutoPrecoAlteradoEvent): Promise<void> {
    console.log(`Recalculating active orders for product: ${event.aggregateId}`);
  }

  private async notificarClientesInteressados(event: ProdutoPrecoAlteradoEvent): Promise<void> {
    console.log(`Notifying interested customers about price change: ${event.aggregateId}`);
  }
}

/**
 * Handler for Produto Desativado Event
 */
export class ProdutoDesativadoHandler extends BaseDomainEventHandler<ProdutoDesativadoEvent> {
  getEventName(): string {
    return 'produto.desativado';
  }

  async handle(event: ProdutoDesativadoEvent): Promise<void> {
    try {
      this.logEvent(event, 'Processing product deactivation');

      // Business logic for product deactivation
      await this.removerDoCatalogo(event);
      await this.cancelarPromocoes(event);
      await this.atualizarPedidosAtivos(event);
      
      this.logEvent(event, 'Product deactivation processed successfully');
    } catch (error) {
      this.handleError(event, error);
      throw error;
    }
  }

  private async removerDoCatalogo(event: ProdutoDesativadoEvent): Promise<void> {
    console.log(`Removing product from catalog: ${event.aggregateId}`);
  }

  private async cancelarPromocoes(event: ProdutoDesativadoEvent): Promise<void> {
    console.log(`Canceling promotions for product: ${event.aggregateId}`);
  }

  private async atualizarPedidosAtivos(event: ProdutoDesativadoEvent): Promise<void> {
    console.log(`Updating active orders for deactivated product: ${event.aggregateId}`);
  }
}
