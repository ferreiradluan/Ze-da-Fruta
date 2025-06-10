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
  ],  providers: [
    AuthService,
    AccountService,
    PartnerOnboardingService,
    GoogleStrategy,
    JwtStrategy,
    GoogleAuthGuard,
    AdminRepository,
    SolicitacaoParceiroRepository,
    RoleRepository,
  ],
  exports: [
    AuthService, 
    AccountService, 
    PartnerOnboardingService,
    SolicitacaoParceiroRepository,
    RoleRepository
  ],
})
export class AccountManagementModule {}
