import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entidades do Domínio
import { Usuario } from './domain/entities/usuario.entity';
import { Admin } from './domain/entities/admin.entity';
import { Role } from './domain/entities/role.entity';
import { Endereco } from './domain/entities/endereco.entity';
import { PerfilUsuario } from './domain/entities/perfil-usuario.entity';
import { SolicitacaoParceiro } from './domain/entities/solicitacao-parceiro.entity';

// Controllers
import { AuthController } from './api/controllers/auth.controller';
import { AccountController } from './api/controllers/account.controller';
import { PartnerOnboardingController } from './api/controllers/partner-onboarding.controller';

// Controllers específicos de parceiros
import { PartnerOrdersController } from './api/controllers/partner-orders.controller';
import { PartnerDashboardController } from './api/controllers/partner-dashboard.controller';
import { PartnerProductsController } from './api/controllers/partner-products.controller';

// Services
import { AuthService } from './application/services/auth.service';
import { AccountService } from './application/services/account.service';
import { PartnerOnboardingService } from './application/services/partner-onboarding.service';

// Repositories
import { UsuarioRepository } from './infrastructure/repositories/usuario.repository';
import { AdminRepository } from './infrastructure/repositories/admin.repository';
import { SolicitacaoParceiroRepository } from './infrastructure/repositories/solicitacao-parceiro.repository';
import { EnderecoRepository } from './infrastructure/repositories/endereco.repository';

// Strategies e Guards
import { GoogleStrategy } from './application/strategies/google.strategy';
import { JwtStrategy } from './application/strategies/jwt.strategy';
import { GoogleAuthGuard } from './application/strategies/google-auth.guard';

// Event Bus
import { EventBusModule } from '../common/event-bus';
// Sales Module para integração com controllers de parceiros
import { SalesModule } from '../2-sales/2-sales.module';

@Module({  imports: [
    TypeOrmModule.forFeature([
      Usuario, 
      Admin, 
      Role,
      Endereco,
      PerfilUsuario,
      SolicitacaoParceiro  // ✅ Usar versão corrigida
    ]),
    EventBusModule,
    SalesModule, // Importar SalesModule para integração com controllers de parceiros
  ],controllers: [
    // Controllers principais:
    AuthController, 
    AccountController, 
    PartnerOnboardingController,
    
    // Controllers específicos de parceiros:
    PartnerOrdersController,      // Pedidos de parceiros
    PartnerDashboardController,   // Dashboard de parceiros  
    PartnerProductsController     // Produtos de parceiros
  ],
  providers: [
    // Services
    AuthService,
    AccountService,  // ✅ Renomear de account.service.new.ts
    PartnerOnboardingService,
    
    // Repositories
    UsuarioRepository,
    AdminRepository,
    SolicitacaoParceiroRepository,  // ✅ Repository para entidade corrigida
    EnderecoRepository,
    
    // Strategies
    GoogleStrategy,
    JwtStrategy,
    GoogleAuthGuard,
  ],
  exports: [
    AuthService,
    AccountService,
    PartnerOnboardingService,
    UsuarioRepository,
    AdminRepository,
  ],
})
export class AccountManagementModule {}
