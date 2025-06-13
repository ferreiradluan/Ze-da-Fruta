import { DataSource } from 'typeorm';
import { seedRoles } from './role.seed';
import { seedAdmin } from './admin.seed';

export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('🌱 Iniciando seeds...');
  
  try {
    // Executar seeds na ordem correta
    await seedRoles(dataSource);
    await seedAdmin(dataSource);
    
    console.log('✅ Seeds executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error);
    throw error;
  }
}

// Script para executar seeds diretamente
if (require.main === module) {
  // Aqui você pode configurar a conexão com o banco
  console.log('Execute este arquivo através do seu script de inicialização do banco');
}
