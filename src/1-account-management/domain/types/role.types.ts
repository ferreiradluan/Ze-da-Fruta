export const ROLE = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SELLER: 'SELLER',
  DELIVERY_PERSON: 'DELIVERY_PERSON'
} as const;

export type Role = typeof ROLE[keyof typeof ROLE];

export const ROLE_ARRAY = Object.values(ROLE);

// ===== ROLES DE DOMÍNIO =====

export const ROLE_NAMES = {
  CLIENTE: 'CLIENTE',
  LOJISTA: 'LOJISTA',
  ENTREGADOR: 'ENTREGADOR',
  MODERADOR: 'MODERADOR',
  ADMIN: 'ADMIN'
} as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];

export const ROLE_NAMES_ARRAY = Object.values(ROLE_NAMES);
