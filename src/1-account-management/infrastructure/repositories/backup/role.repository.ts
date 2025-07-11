import { EntityRepository, Repository } from 'typeorm';
import { Role } from '../../../domain/entities/role.entity';

@EntityRepository(Role)
export class RoleRepository extends Repository<Role> {}