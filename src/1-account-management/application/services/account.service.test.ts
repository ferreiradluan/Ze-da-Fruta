import { Injectable, Logger } from '@nestjs/common';

/**
 * AccountService - Camada de Lógica de Negócio
 * Implementa casos de uso relacionados à gestão de contas
 */
@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor() {}

  async test(): Promise<string> {
    return 'test';
  }
}
