export const StatusEntrega = {
  AGUARDANDO_ACEITE: 'AGUARDANDO_ACEITE',
  ACEITA: 'ACEITA',
  A_CAMINHO_DA_LOJA: 'A_CAMINHO_DA_LOJA',
  COLETADO: 'COLETADO',
  EM_TRANSPORTE: 'EM_TRANSPORTE',
  ENTREGUE: 'ENTREGUE',
  FALHOU: 'FALHOU',
  CANCELADA: 'CANCELADA'
} as const;

export type StatusEntregaType = typeof StatusEntrega[keyof typeof StatusEntrega];

// Validador para garantir que apenas valores válidos sejam aceitos
export const isValidStatusEntrega = (status: string): status is StatusEntregaType => {
  return Object.values(StatusEntrega).includes(status as StatusEntregaType);
};

// Array para validações de DTOs
export const STATUS_ENTREGA_VALUES = Object.values(StatusEntrega);
