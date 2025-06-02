import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilUsuarioEntity } from '../common/entities/perfil-usuario.entity';
import { PerfilUsuarioService } from './perfil-usuario.service';
import { PerfilUsuarioController } from './perfil-usuario.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([PerfilUsuarioEntity]), UsersModule],
  controllers: [PerfilUsuarioController],
  providers: [PerfilUsuarioService],
  exports: [TypeOrmModule, PerfilUsuarioService],
})
export class PerfilUsuarioModule {}
