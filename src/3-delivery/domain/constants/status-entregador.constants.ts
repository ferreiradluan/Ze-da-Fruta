export const StatusEntregador = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  SUSPENSO: 'SUSPENSO'
} as const;

export type StatusEntregadorType = typeof StatusEntregador[keyof typeof StatusEntregador];

// Validador para garantir que apenas valores válidos sejam aceitos
export const isValidStatusEntregador = (status: string): status is StatusEntregadorType => {
  return Object.values(StatusEntregador).includes(status as StatusEntregadorType);
};

// Array para validações de DTOs
export const STATUS_ENTREGADOR_VALUES = Object.values(StatusEntregador);
