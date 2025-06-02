import { Module } from '@nestjs/common';
import { VendedorController } from './vendedor.controller';

@Module({
  controllers: [VendedorController],
})
export class VendedorModule {}
