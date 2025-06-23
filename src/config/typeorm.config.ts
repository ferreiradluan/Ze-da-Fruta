import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// ATENÇÃO: APENAS UM BANCO DE DADOS DEVE SER USADO - db/ze_da_fruta.sqlite
export default new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_PATH || join(__dirname, '..', '..', 'db', 'ze_da_fruta.sqlite'),
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  synchronize: true, // Habilita sincronização automática
});