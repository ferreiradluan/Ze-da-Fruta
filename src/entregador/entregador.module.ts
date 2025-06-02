import { Module } from '@nestjs/common';
import { EntregadorController } from './entregador.controller';

@Module({
  controllers: [EntregadorController],
})
export class EntregadorModule {}
