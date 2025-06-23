export const TIPO_SOLICITACAO = {
  LOJISTA: 'LOJISTA',
  ENTREGADOR: 'ENTREGADOR'
} as const;

export type TipoSolicitacao = typeof TIPO_SOLICITACAO[keyof typeof TIPO_SOLICITACAO];

export const TIPO_SOLICITACAO_ARRAY = Object.values(TIPO_SOLICITACAO);
