import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entidades do Domínio
import { Usuario } from './domain/entities/usuario.entity';
import { Admin } from './domain/entities/admin.entity';
import { Role } from './domain/entities/role.entity';
import { Endereco } from './domain/entities/endereco.entity';
import { PerfilUsuario } from './domain/entities/perfil-usuario.entity';
import { SolicitacaoParceiroNew } from './domain/entities/solicitacao-parceiro-new.entity';

// Controllers
import { AuthController } from './api/controllers/auth.controller';
import { AccountController } from './api/controllers/account.controller';
import { PartnerOnboardingNewController } from './api/controllers/partner-onboarding-new.controller';

// Services
import { AuthService } from './application/services/auth.service';
import { AccountService } from './application/services/account.service';
import { PartnerOnboardingService } from './application/services/partner-onboarding.service';

// Repositories
import { UsuarioRepository } from './infrastructure/repositories/usuario.repository';
import { AdminRepository } from './infrastructure/repositories/admin.repository';
import { SolicitacaoParceiroNewRepository } from './infrastructure/repositories/solicitacao-parceiro-new.repository';
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
      SolicitacaoParceiroNew  // ✅ Usar versão nova
    ]),
    EventBusModule,
  ],
  controllers: [
    AuthController, 
    AccountController, 
    PartnerOnboardingNewController  // ✅ Registrar versão nova
  ],
  providers: [
    // Services
    AuthService,
    AccountService,  // ✅ Renomear de account.service.new.ts
    PartnerOnboardingService,
    
    // Repositories
    UsuarioRepository,
    AdminRepository,
    SolicitacaoParceiroNewRepository,  // ✅ Criar para nova entidade
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
