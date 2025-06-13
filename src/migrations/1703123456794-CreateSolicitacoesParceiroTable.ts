import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSolicitacoesParceiroTable1703123456794 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'solicitacoes_parceiro',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'telefone',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'cpf',
            type: 'varchar',
            length: '14',
          },
          {
            name: 'dados',
            type: 'json',
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDENTE'",
          },
          {
            name: 'dataProcessamento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'observacoes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'motivoRejeicao',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('solicitacoes_parceiro');
  }
}
