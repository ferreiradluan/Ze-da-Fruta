export const STATUS_USUARIO = {
  PENDENTE: 'PENDENTE',
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  SUSPENSO: 'SUSPENSO',
} as const;

export type StatusUsuario = typeof STATUS_USUARIO[keyof typeof STATUS_USUARIO];

// Validador para garantir que apenas valores válidos sejam aceitos
export const isValidStatusUsuario = (status: string): status is StatusUsuario => {
  return Object.values(STATUS_USUARIO).includes(status as StatusUsuario);
};

// Array para validações de DTOs
export const STATUS_USUARIO_VALUES = Object.values(STATUS_USUARIO);
