export const ROLE_TYPE = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  PARTNER: 'PARTNER',
  DELIVERY: 'DELIVERY'
} as const;

export type RoleType = typeof ROLE_TYPE[keyof typeof ROLE_TYPE];

export const ROLE_TYPE_ARRAY = Object.values(ROLE_TYPE);
