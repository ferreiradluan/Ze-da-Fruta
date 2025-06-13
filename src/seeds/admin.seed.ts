import { DataSource } from 'typeorm';
import { Admin } from '../1-account-management/domain/entities/admin.entity';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const adminRepository = dataSource.getRepository(Admin);

  const adminEmail = 'admin@zefruta.com';
  const existingAdmin = await adminRepository.findOne({ 
    where: { email: adminEmail } 
  });

  if (!existingAdmin) {
    const admin = adminRepository.create({
      nome: 'Administrador Sistema',
      email: adminEmail,
      status: 'ATIVO',
    });

    // Definir senha padrão
    await admin.definirSenha('admin123!@#');
    
    await adminRepository.save(admin);
    console.log(`✅ Admin inicial criado: ${adminEmail}`);
    console.log(`🔑 Senha padrão: admin123!@#`);
  } else {
    console.log(`ℹ️  Admin ${adminEmail} já existe`);
  }
}
