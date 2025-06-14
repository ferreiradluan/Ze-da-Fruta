import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class UpdatePagamentoTable20250613235902 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pagamentos', true);
    
    await queryRunner.createTable(new Table({
      name: 'pagamentos',
      columns: [
        {
          name: 'id',
          type: 'varchar',
          length: '36',
          isPrimary: true,
          generationStrategy: 'uuid'
        },
        {
          name: 'pedido_id',
          type: 'varchar',
          length: '36',
          isNullable: false
        },
        {
          name: 'valor',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: false
        },
        {
          name: 'status',
          type: 'varchar',
          length: '50',
          isNullable: false
        },
        {
          name: 'provedor',
          type: 'varchar',
          length: '100',
          default: "'stripe'"
        },
        {
          name: 'id_transacao_externa',
          type: 'varchar',
          length: '255',
          isNullable: true
        },
        {
          name: 'created_at',
          type: 'datetime',
          default: 'CURRENT_TIMESTAMP'
        },
        {
          name: 'updated_at',
          type: 'datetime',
          default: 'CURRENT_TIMESTAMP'
        }
      ]
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pagamentos');
  }
}
