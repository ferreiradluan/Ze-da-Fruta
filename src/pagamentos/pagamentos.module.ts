import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagamentosController } from './pagamentos.controller';
import { PagamentosService } from './pagamentos.service';
import { Pagamento } from '../common/entities/pagamento.entity';
import { StripeService } from './stripe.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pagamento])],
  controllers: [PagamentosController],
  providers: [PagamentosService, StripeService],
  exports: [PagamentosService, StripeService], // exporta ambos para outros módulos
})
export class PagamentosModule {}