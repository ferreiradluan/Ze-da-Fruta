import { Module } from '@nestjs/common';
import { AuthController } from './api/controllers/auth.controller';
import { AccountController } from './api/controllers/account.controller';
import { AddressController } from './api/controllers/address.controller';
import { PartnerOnboardingController } from './api/controllers/partner-onboarding.controller';
import { AuthService } from './application/services/auth.service';
import { AccountService } from './application/services/account.service';
import { PartnerOnboardingService } from './application/services/partner-onboarding.service';
import { GoogleStrategy } from './application/strategies/google.strategy';
import { JwtStrategy } from './application/strategies/jwt.strategy';
import { GoogleAuthGuard } from './application/strategies/google-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './domain/entities/usuario.entity';
import { Admin } from './domain/entities/admin.entity';
import { SolicitacaoParceiro } from './domain/entities/solicitacao-parceiro.entity';
import { AdminRepository } from './infrastructure/repositories/admin.repository';
import { SolicitacaoParceiroRepository } from './infrastructure/repositories/solicitacao-parceiro.repository';
import { Role } from './domain/entities/role.entity';
import { RoleRepository } from './infrastructure/repositories/role.repository';
import { Endereco } from './domain/entities/endereco.entity';
import { PerfilUsuario } from './domain/entities/perfil-usuario.entity';
import { EventBusModule } from '../common/event-bus';

// Rich Domain Model imports
import { UsuarioDomainService } from './domain/services/usuario-domain.service';
import { DomainEventDispatcher } from '../common/domain/events/domain-event.base';
import { RichDomainBootstrap } from '../common/domain/rich-domain-bootstrap';
import { DomainEventRegistry } from '../common/domain/events/domain-event-registry';
import { DomainServiceIntegration } from '../common/domain/services/domain-service-integration';

// Domain Event Handlers
import { 
  UsuarioCriadoHandler,
  UsuarioAtualizadoHandler,
  UsuarioDesativadoHandler,
  UsuarioSuspensoHandler,
  SenhaAlteradaHandler
} from './domain/events/handlers/usuario.handlers';

// Repository Interfaces (for dependency injection)
import { IUsuarioRepository } from './domain/repositories/usuario.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario, 
      Admin, 
      SolicitacaoParceiro, 
      Role, 
      Endereco, 
      PerfilUsuario
    ]),
    EventBusModule, // Para acessar o EventBusService
  ],
  controllers: [
    AuthController, 
    AccountController, 
    AddressController,
    PartnerOnboardingController
  ],
  providers: [
    // Application Services
    AuthService,
    AccountService,
    PartnerOnboardingService,
    
    // Infrastructure
    AdminRepository,
    SolicitacaoParceiroRepository,
    RoleRepository,
    
    // Authentication
    GoogleStrategy,
    JwtStrategy,
    GoogleAuthGuard,
    
    // Rich Domain Model Components
    UsuarioDomainService,
    DomainEventDispatcher,
    DomainEventRegistry,
    DomainServiceIntegration,
    RichDomainBootstrap,
    
    // Domain Event Handlers
    UsuarioCriadoHandler,
    UsuarioAtualizadoHandler,
    UsuarioDesativadoHandler,
    UsuarioSuspensoHandler,
    SenhaAlteradaHandler,
    
    // Repository Interface Providers (Dependency Injection)
    {
      provide: 'IUsuarioRepository',
      useExisting: AdminRepository, // Temporary - will be replaced with proper implementation
    },
  ],
  exports: [
    AuthService, 
    AccountService, 
    PartnerOnboardingService,
    SolicitacaoParceiroRepository,
    RoleRepository,
    
    // Export Domain Services for cross-module usage
    UsuarioDomainService,
    DomainServiceIntegration,
  ],
})
export class AccountManagementModule {
  constructor(private readonly richDomainBootstrap: RichDomainBootstrap) {}

  async onModuleInit() {
    // Initialize Rich Domain Model components
    await this.richDomainBootstrap.initialize();
  }
}
