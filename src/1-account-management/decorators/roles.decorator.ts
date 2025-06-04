import { SetMetadata } from '@nestjs/common';
import { Role3 } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role3[]) => SetMetadata(ROLES_KEY, roles); 