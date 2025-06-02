import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstabelecimentosController } from './estabelecimentos.controller';
import { EstabelecimentosService } from './estabelecimentos.service';
import { Estabelecimento } from '../common/entities/estabelecimento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Estabelecimento])],
  controllers: [EstabelecimentosController],
  providers: [EstabelecimentosService],
  exports: [EstabelecimentosService], // exporta o service para outros módulos
})
export class EstabelecimentosModule {}