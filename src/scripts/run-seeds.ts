import { DataSource } from 'typeorm';
import { runSeeds } from '../seeds';

// Importar entidades
import { Usuario } from '../1-account-management/domain/entities/usuario.entity';
import { Admin } from '../1-account-management/domain/entities/admin.entity';
import { Role } from '../1-account-management/domain/entities/role.entity';
import { Endereco } from '../1-account-management/domain/entities/endereco.entity';
import { PerfilUsuario } from '../1-account-management/domain/entities/perfil-usuario.entity';
import { SolicitacaoParceiro } from '../1-account-management/domain/entities/solicitacao-parceiro.entity';

async function executarSeeds() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: 'database.sqlite',
    entities: [
      Usuario,
      Admin,
      Role,
      Endereco,
      PerfilUsuario,
      SolicitacaoParceiro,
    ],
    synchronize: false, // Use migrations ao invés de synchronize
    logging: true,
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    await runSeeds(dataSource);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executarSeeds()
    .then(() => {
      console.log('🌱 Seeds concluídos com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha ao executar seeds:', error);
      process.exit(1);
    });
}
