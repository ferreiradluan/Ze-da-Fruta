export const StatusDisponibilidade = {
  DISPONIVEL: 'DISPONIVEL',
  EM_ENTREGA: 'EM_ENTREGA',
  INDISPONIVEL: 'INDISPONIVEL'
} as const;

export type StatusDisponibilidadeType = typeof StatusDisponibilidade[keyof typeof StatusDisponibilidade];

// Validador para garantir que apenas valores válidos sejam aceitos
export const isValidStatusDisponibilidade = (status: string): status is StatusDisponibilidadeType => {
  return Object.values(StatusDisponibilidade).includes(status as StatusDisponibilidadeType);
};

// Array para validações de DTOs
export const STATUS_DISPONIBILIDADE_VALUES = Object.values(StatusDisponibilidade);
