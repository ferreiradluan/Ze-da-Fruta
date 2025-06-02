import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnderecosController } from './enderecos.controller';
import { EnderecosService } from './enderecos.service';
import { Endereco } from '../common/entities/endereco.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Endereco])],
  controllers: [EnderecosController],
  providers: [EnderecosService],
  exports: [EnderecosService],
})
export class EnderecosModule {}