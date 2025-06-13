import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePerfisUsuarioTable1703123456793 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'perfis_usuario',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'telefone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'documento',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'tipoDocumento',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'dataNascimento',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'genero',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'statusPerfil',
            type: 'varchar',
            length: '20',
            default: "'INCOMPLETO'",
          },
          {
            name: 'emailVerificado',
            type: 'boolean',
            default: false,
          },
          {
            name: 'telefoneVerificado',
            type: 'boolean',
            default: false,
          },
          {
            name: 'documentoVerificado',
            type: 'boolean',
            default: false,
          },
          {
            name: 'usuarioId',
            type: 'uuid',
            isUnique: true,
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

    await queryRunner.createForeignKey(
      'perfis_usuario',
      new TableForeignKey({
        columnNames: ['usuarioId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'usuarios',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('perfis_usuario');
  }
}
