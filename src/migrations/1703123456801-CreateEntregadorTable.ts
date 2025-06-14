import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEntregadorTable1703123456801 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela entregadores se não existir
    const tableExists = await queryRunner.hasTable('entregador');
    
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'entregador',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
            },
            {
              name: 'nome',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isUnique: true,
            },
            {
              name: 'telefone',
              type: 'varchar',
              length: '20',
              isUnique: true,
            },
            {
              name: 'fotoPerfil',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'ATIVO'",
            },
            {
              name: 'disponibilidade',
              type: 'varchar',
              length: '20',
              default: "'INDISPONIVEL'",
            },
            {
              name: 'veiculoInfo',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'cnh',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'avaliacaoMedia',
              type: 'decimal',
              precision: 3,
              scale: 2,
              default: 0,
            },
            {
              name: 'totalEntregas',
              type: 'integer',
              default: 0,
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
        }),
      );
      
      // Criar índices para performance
      await queryRunner.createIndex('entregador', new TableIndex({
        name: 'IDX_ENTREGADOR_EMAIL',
        columnNames: ['email']
      }));
      
      await queryRunner.createIndex('entregador', new TableIndex({
        name: 'IDX_ENTREGADOR_TELEFONE', 
        columnNames: ['telefone']
      }));
      
      await queryRunner.createIndex('entregador', new TableIndex({
        name: 'IDX_ENTREGADOR_STATUS',
        columnNames: ['status']
      }));
      
      await queryRunner.createIndex('entregador', new TableIndex({
        name: 'IDX_ENTREGADOR_DISPONIBILIDADE',
        columnNames: ['disponibilidade']
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('entregador');
  }
}
