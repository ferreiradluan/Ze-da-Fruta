import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

export default new DataSource({
  type: 'better-sqlite3',
  database: isTest 
    ? join(__dirname, '..', '..', 'test', 'test.sqlite')
    : join(__dirname, '..', '..', 'database.sqlite'),
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  synchronize: true, // Habilita sincronização automática
}); 