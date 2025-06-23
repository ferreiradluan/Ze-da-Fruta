/**
 * 🔧 CORREÇÕES PARA /auth/user EM PRODUÇÃO
 * 
 * Este arquivo contém as principais correções para problemas
 * com autenticação OAuth Google em produção.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductionAuthFixService {
  private readonly logger = new Logger(ProductionAuthFixService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Verifica e corrige configurações OAuth para produção
   */
  async verificarConfiguracaoOAuth(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar variáveis essenciais
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const googleClientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const googleCallbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!googleClientId) {
      errors.push('GOOGLE_CLIENT_ID não configurado');
    }

    if (!googleClientSecret) {
      errors.push('GOOGLE_CLIENT_SECRET não configurado');
    }

    if (!googleCallbackUrl) {
      errors.push('GOOGLE_CALLBACK_URL não configurado');
    } else if (googleCallbackUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
      errors.push('GOOGLE_CALLBACK_URL ainda aponta para localhost em produção');
    }

    if (!jwtSecret || jwtSecret.length < 32) {
      errors.push('JWT_SECRET não configurado ou muito curto (mínimo 32 caracteres)');
    }

    // Verificar URLs de produção
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      warnings.push('FRONTEND_URL não configurado - usando padrão');
    }

    this.logger.log(`Verificação OAuth completa. Erros: ${errors.length}, Avisos: ${warnings.length}`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Retorna URLs corretas baseadas no ambiente
   */
  getURLsParaAmbiente(): {
    baseUrl: string;
    frontendUrl: string;
    callbackUrl: string;
  } {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      return {
        baseUrl: this.configService.get<string>('BACKEND_URL') || 'https://sua-url-producao.com',
        frontendUrl: this.configService.get<string>('FRONTEND_URL') || 'https://seu-frontend.com',
        callbackUrl: this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'https://sua-url-producao.com/auth/google/callback'
      };
    } else {
      return {
        baseUrl: 'http://localhost:3000',
        frontendUrl: 'http://localhost:3001',
        callbackUrl: 'http://localhost:3000/auth/google/callback'
      };
    }
  }

  /**
   * Logs de debug para problemas de autenticação
   */
  logDebugAuth(context: string, data: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`[${context}] ${JSON.stringify(data, null, 2)}`);
    }
  }
}
