import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountProfileController } from './profile.controller';
import { AccountEnderecosController } from './enderecos.controller';
import { AccountProfileService } from './profile.service';
import { AccountEnderecosService } from './enderecos.service';
import { User } from '../users/entities/user.entity';
import { Endereco } from '../common/entities/endereco.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Endereco])],
  controllers: [AccountProfileController, AccountEnderecosController],
  providers: [AccountProfileService, AccountEnderecosService],
  exports: [AccountProfileService, AccountEnderecosService],
})
export class AccountModule {}
