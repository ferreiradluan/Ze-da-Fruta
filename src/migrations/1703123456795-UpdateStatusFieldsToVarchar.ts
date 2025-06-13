import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStatusFieldsToVarchar1703123456795 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Atualizar status dos usuários para varchar
    await queryRunner.query(`
      ALTER TABLE usuarios 
      ALTER COLUMN status TYPE varchar(20)
    `);

    // Atualizar campos da tabela solicitacoes_parceiro
    await queryRunner.query(`
      ALTER TABLE solicitacoes_parceiro 
      ALTER COLUMN tipo TYPE varchar(20),
      ALTER COLUMN status TYPE varchar(20)
    `);

    // Atualizar campos da tabela roles
    await queryRunner.query(`
      ALTER TABLE roles 
      ALTER COLUMN nome TYPE varchar(50)
    `);

    // Adicionar campos ao perfis_usuario
    await queryRunner.query(`
      ALTER TABLE perfis_usuario 
      ADD COLUMN IF NOT EXISTS genero varchar(20),
      ADD COLUMN IF NOT EXISTS bio text,
      ADD COLUMN IF NOT EXISTS emailVerificado boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS telefoneVerificado boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS documentoVerificado boolean DEFAULT false,
      ALTER COLUMN statusPerfil TYPE varchar(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter alterações se necessário
  }
}
