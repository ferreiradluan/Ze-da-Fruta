import { DataSource } from 'typeorm';
import { Role } from '../1-account-management/domain/entities/role.entity';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);

  const rolesData = [
    {
      nome: 'CLIENTE',
      descricao: 'Usuário cliente da plataforma',
      ativa: true,
    },
    {
      nome: 'LOJISTA',
      descricao: 'Parceiro lojista vendedor',
      ativa: true,
    },
    {
      nome: 'ENTREGADOR',
      descricao: 'Parceiro entregador',
      ativa: true,
    },
    {
      nome: 'MODERADOR',
      descricao: 'Moderador da plataforma',
      ativa: true,
    },
    {
      nome: 'ADMIN',
      descricao: 'Administrador da plataforma',
      ativa: true,
    },
  ];

  for (const roleData of rolesData) {
    const existingRole = await roleRepository.findOne({ 
      where: { nome: roleData.nome } 
    });

    if (!existingRole) {
      const role = roleRepository.create(roleData);
      await roleRepository.save(role);
      console.log(`✅ Role ${roleData.nome} criada`);
    } else {
      console.log(`ℹ️  Role ${roleData.nome} já existe`);
    }
  }
}
