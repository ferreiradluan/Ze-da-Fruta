import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { EntregasModule } from './entregas/entregas.module';
import { EnderecosModule } from './enderecos/enderecos.module';
import { EstabelecimentosModule } from './estabelecimentos/estabelecimentos.module';
import { CuponsModule } from './cupons/cupons.module';
import { PagamentosModule } from './pagamentos/pagamentos.module';
import { ItensPedidoModule } from './itens-pedido/itens-pedido.module';
import { UploadModule } from './upload/upload.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { MemorySessionGuard } from './auth/guards/memory-session.guard';
import { PerfilUsuarioModule } from './perfil-usuario/perfil-usuario.module';
import { VendedorModule } from './vendedor/vendedor.module';
import { EntregadorModule } from './entregador/entregador.module';
import { MinhaContaController } from './auth/minha-conta.controller';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60, // 1 minute
      limit: 10, // 10 requests per minute
    }]),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(process.cwd(), 'database.sqlite'),
      entities: [join(__dirname, '/**/*.entity{.ts,.js}')],
      synchronize: true, // Habilita sincronização automática
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      exclude: ['/api*'],
    }),
    // Módulos de autenticação primeiro
    AuthModule,
    UsersModule,
    // Demais módulos
    ProductsModule,
    CategoriesModule,
    UsuariosModule,
    PedidosModule,
    EntregasModule,
    EnderecosModule,
    EstabelecimentosModule,
    CuponsModule,
    PagamentosModule,
    ItensPedidoModule,
    UploadModule,
    PerfilUsuarioModule,
    VendedorModule,
    EntregadorModule,
    AdminModule,
  ],
  controllers: [AppController, MinhaContaController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: MemorySessionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}