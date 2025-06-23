// src/common/api-endpoints.ts
// Organização dos endpoints da API por fluxo de sistema e domínio de negócio
// Inclui métodos REST comuns, mesmo que não estejam explicitamente no Swagger

export const ApiEndpoints = {
  admin: {
    cupons: {
      criar: '/cupons',
      listar: '/cupons',
      buscarPorCodigo: '/cupons/{codigo}',
      atualizar: '/cupons/{id}',
      desativar: '/cupons/{id}/desativar',
      validar: '/cupons/validar',
      ativar: '/cupons/{id}/ativar', // método comum
      deletar: '/cupons/{id}', // método comum
    },
    categorias: {
      listar: '/categorias',
      criar: '/categorias',
      atualizar: '/categorias/{id}',
      deletar: '/categorias/{id}',
    },
    estabelecimentos: {
      listarTodas: '/sales/lojas/admin/todas',
      detalhar: '/sales/lojas/admin/{id}', // método comum
      atualizar: '/sales/lojas/admin/{id}', // método comum
      deletar: '/sales/lojas/admin/{id}', // método comum
    },
    gestao: {
      dashboard: '/admin/dashboard',
      pedidos: {
        reembolso: '/admin/pedidos/{id}/reembolso',
        listar: '/admin/pedidos', // método comum
        detalhar: '/admin/pedidos/{id}', // método comum
      },
      relatoriosVendas: '/admin/relatorios/vendas',
      solicitacoes: {
        listar: '/admin/solicitacoes',
        aprovar: '/admin/solicitacoes/{id}/aprovar',
        rejeitar: '/admin/solicitacoes/{id}/rejeitar',
        estatisticas: '/admin/solicitacoes/estatisticas',
      },
      usuarios: {
        listar: '/admin/usuarios',
        alterarStatus: '/admin/usuarios/{id}/status',
        detalhar: '/admin/usuarios/{id}', // método comum
        atualizar: '/admin/usuarios/{id}', // método comum
        deletar: '/admin/usuarios/{id}', // método comum
      },
    },
  },
  lojista: {
    pedidos: {
      listar: '/lojista/pedidos',
      atualizarStatus: '/lojista/pedidos/{id}/status',
      detalhar: '/lojista/pedidos/{id}', // método comum
      atualizar: '/lojista/pedidos/{id}', // método comum
      deletar: '/lojista/pedidos/{id}', // método comum
    },
  },
  parceiro: {
    estabelecimentos: {
      minhasLojas: '/sales/lojas/minhas-lojas',
      criar: '/sales/lojas', // método comum
      atualizar: '/sales/lojas/{id}', // método comum
      deletar: '/sales/lojas/{id}', // método comum
      detalhar: '/sales/lojas/{id}', // método comum
    },
    produtos: {
      criar: '/produtos',
      atualizar: '/produtos/{id}',
      deletar: '/produtos/{id}',
      detalhar: '/produtos/{id}',
      listarGerenciar: '/produtos/gerenciar',
      listarPorEstabelecimento: '/produtos/estabelecimento/{id}', // método comum
      ativar: '/produtos/{id}/ativar', // método comum
      desativar: '/produtos/{id}/desativar', // método comum
    },
  },
  cliente: {
    enderecos: {
      adicionar: '/address',
      atualizar: '/address/{id}',
      remover: '/address/{id}',
      definirPrincipal: '/address/{id}/principal',
      meusEnderecos: '/address/meus-enderecos',
    },
    pedidos: {
      criar: '/pedidos',
      listar: '/pedidos',
      buscarPorId: '/pedidos/{id}',
      cancelar: '/pedidos/{id}/cancelar',
      aplicarCupom: '/pedidos/{id}/cupom',
      removerCupom: '/pedidos/{id}/cupom',
      adicionarItem: '/pedidos/{id}/itens',
      removerItem: '/pedidos/{id}/itens/{itemId}',
      atualizarItem: '/pedidos/{id}/itens/{itemId}',
      atualizarStatus: '/pedidos/{id}/status',
      validarCupom: '/pedidos/{id}/validar-cupom',
    },
    perfil: {
      obter: '/account/profile/me',
      atualizar: '/account/profile/me',
    },
  },
  pagamento: {
    cancelar: '/payment/cancel/{transacaoId}',
    listarMetodos: '/payment/methods',
    consultarPorPedido: '/payment/pedido/{pedidoId}',
    processar: '/payment/process',
    refund: '/payment/refund/{transacaoId}',
    status: '/payment/status/{transacaoId}',
    webhook: '/payment/webhook',
    webhookStripe: '/payment/webhook/stripe',
  },
  upload: {
    establishmentPhoto: '/upload/establishment-photo/{establishmentId}',
    productPhoto: '/upload/product-photo/{productId}',
    profilePhoto: '/upload/profile-photo',
    deleteProfilePhoto: '/upload/profile-photo',
  },  autenticacao: {
    adminLogin: '/auth/admin/login',
    userGoogle: '/auth/user/google',
    vendedorGoogle: '/auth/vendedor/google',
    entregadorGoogle: '/auth/entregador/google',
    google: '/auth/google', // Mantido para compatibilidade
    googleCallback: '/auth/google/callback',
    userGoogleCallback: '/auth/user/google/callback',
    vendedorGoogleCallback: '/auth/vendedor/google/callback',
    entregadorGoogleCallback: '/auth/entregador/google/callback',
  },
  onboarding: {
    entregador: '/parceiros/solicitacoes/entregador',
    lojista: '/parceiros/solicitacoes/loja',
  },
  entregador: {
    aceitarEntrega: '/delivery/entregas/{id}/aceitar',
    entregasDisponiveis: '/delivery/entregas/disponiveis',
    perfil: '/delivery/profile/me',
    listarEntregas: '/delivery/entregas', // método comum
    atualizarEntrega: '/delivery/entregas/{id}', // método comum
  },  sales: {
    pedidos: {
      criar: '/pedidos',
      obter: '/pedidos/{id}',
      aplicarCupom: '/pedidos/{id}/cupom',
      listarPorLoja: '/pedidos/loja/{estabelecimentoId}'
    },
    produtos: {
      listarPorLoja: '/produtos/loja/{lojaId}',
      obterDetalhes: '/produtos/{id}/detalhes',
      buscarPublico: '/produtos/publico',
      categorias: '/produtos/categorias'
    },
    lojas: {
      listar: '/sales/lojas',
      obterDetalhes: '/sales/lojas/{id}',
      produtos: '/sales/lojas/{id}/produtos',
      validarCupom: '/sales/lojas/cupom/validar'
    }
  },
  catalogo: {
    produtoDetalhe: '/produtos/catalogo/{id}',
    categorias: '/produtos/categorias',
    estabelecimentos: '/produtos/estabelecimentos',
    lojas: '/sales/lojas',
    lojaDetalhe: '/sales/lojas/{id}',
    produtosDaLoja: '/sales/lojas/{id}/produtos',
    produtosDaLojaCompleto: '/sales/lojas/{id}/produtos/completo',
  },
};

// Exemplo de uso:
// ApiEndpoints.admin.cupons.criar
// ApiEndpoints.cliente.pedidos.listar
