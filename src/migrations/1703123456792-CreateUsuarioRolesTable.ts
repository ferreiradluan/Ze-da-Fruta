import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateUsuarioRolesTable1703123456792 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'usuario_roles',
        columns: [
          {
            name: 'usuario_id',
            type: 'uuid',
          },
          {
            name: 'role_id',
            type: 'uuid',
          },
        ],
      }),
      true,
    );

    await queryRunner.createPrimaryKey('usuario_roles', ['usuario_id', 'role_id']);

    await queryRunner.createForeignKey(
      'usuario_roles',
      new TableForeignKey({
        columnNames: ['usuario_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'usuarios',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'usuario_roles',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('usuario_roles');
  }
}
