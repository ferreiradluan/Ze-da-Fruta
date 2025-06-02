import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntregasController } from './entregas.controller';
import { EntregasService } from './entregas.service';
import { Entrega } from '../common/entities/entrega.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Entrega])],
  controllers: [EntregasController],
  providers: [EntregasService],
})
export class EntregasModule {}