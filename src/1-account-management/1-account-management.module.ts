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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario, 
      Admin, 
      Role,
      Endereco,
      PerfilUsuario,
      SolicitacaoParceiro  // ✅ Usar versão corrigida
    ]),
    EventBusModule,
  ],  controllers: [
    AuthController, 
    AccountController, 
    PartnerOnboardingController  // ✅ Registrar versão corrigida
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
