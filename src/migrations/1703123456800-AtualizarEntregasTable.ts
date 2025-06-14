import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AtualizarEntregasTable1703123456800 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela entregas se não existir
    const tableExists = await queryRunner.hasTable('entregas');
    
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'entregas',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
            },
            {
              name: 'pedidoId',
              type: 'varchar',
              length: '36',
            },
            {
              name: 'entregadorId',
              type: 'varchar',
              length: '36',
              isNullable: true,
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              default: "'AGUARDANDO_ACEITE'",
            },
            {
              name: 'enderecoColeta',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'enderecoEntrega',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'dataEstimada',
              type: 'datetime',
              isNullable: true,
            },
            {
              name: 'createdAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updatedAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),      );
      
      // Criar índices para performance
      await queryRunner.createIndex('entregas', new TableIndex({
        name: 'IDX_ENTREGAS_PEDIDO',
        columnNames: ['pedidoId']
      }));
      
      await queryRunner.createIndex('entregas', new TableIndex({
        name: 'IDX_ENTREGAS_ENTREGADOR', 
        columnNames: ['entregadorId']
      }));
      
      await queryRunner.createIndex('entregas', new TableIndex({
        name: 'IDX_ENTREGAS_STATUS',
        columnNames: ['status']
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('entregas');
  }
}
