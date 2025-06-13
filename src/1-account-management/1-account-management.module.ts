import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers da Camada de API
import { AuthController } from './api/controllers/auth.controller';
import { AccountController } from './api/controllers/account.controller';
import { PartnerOnboardingController } from './api/controllers/partner-onboarding.controller';

// Services da Camada de Lógica de Negócio
import { AuthService } from './application/services/auth.service';
import { AccountService } from './application/services/account.service';
import { PartnerOnboardingService } from './application/services/partner-onboarding.service';

// Entidades do Domínio
import { Usuario } from './domain/entities/usuario.entity';
import { Admin } from './domain/entities/admin.entity';
import { Role } from './domain/entities/role.entity';
import { Endereco } from './domain/entities/endereco.entity';
import { PerfilUsuario } from './domain/entities/perfil-usuario.entity';
import { SolicitacaoParceiro } from './domain/entities/solicitacao-parceiro.entity';

// Repositories da Camada de Acesso a Dados
import { UsuarioRepository } from './infrastructure/repositories/usuario.repository';
import { AdminRepository } from './infrastructure/repositories/admin.repository';
import { SolicitacaoParceiroRepository } from './infrastructure/repositories/solicitacao-parceiro.repository';

// Strategies e Guards (mantidos para funcionalidade)
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
      SolicitacaoParceiro
    ]),
    EventBusModule,
  ],
  controllers: [
    AuthController, 
    AccountController, 
    PartnerOnboardingController
  ],
  providers: [
    AuthService,
    AccountService,
    PartnerOnboardingService,
    UsuarioRepository,
    AdminRepository,
    SolicitacaoParceiroRepository,
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
    SolicitacaoParceiroRepository,
  ],
})
export class AccountManagementModule {}
