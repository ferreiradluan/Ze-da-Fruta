export interface SolicitacaoRecebidaEvent {
  solicitacaoId: string;
  tipo: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  timestamp: Date;
  
  // Dados específicos por tipo
  dadosEspecificos: {
    // Para lojista
    nomeEstabelecimento?: string;
    cnpj?: string;
    descricaoNegocio?: string;
    
    // Para entregador
    tipoVeiculo?: string;
    modeloVeiculo?: string;
    placaVeiculo?: string;
    numeroCNH?: string;
  };
  
  endereco: {
    endereco: string;
    numeroEndereco: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
}
