// Exemplo de uso do Domínio Rico - 2-sales
// Este arquivo demonstra como usar as entidades com domínio rico

import { Pedido } from '../domain/entities/pedido.entity';
import { Produto } from '../domain/entities/produto.entity';
import { Cupom, TipoDesconto } from '../domain/entities/cupom.entity';
import { ItemPedido } from '../domain/entities/item-pedido.entity';
import { Estabelecimento } from '../domain/entities/estabelecimento.entity';
import { StatusPedido } from '../domain/enums/status-pedido.enum';
import { Dinheiro } from '../domain/value-objects/dinheiro.vo';

/**
 * Exemplo 1: Criando um pedido com domínio rico
 */
export async function exemploCreatePedidoRico() {
  // Criar estabelecimento
  const estabelecimento = new Estabelecimento();
  estabelecimento.nome = "Hortifruti do João";
  estabelecimento.estaAberto = true;
  estabelecimento.ativo = true;

  // Criar produtos com preços usando Value Object
  const banana = new Produto();
  banana.nome = "Banana Prata";
  banana.setPreco(Dinheiro.criar(2.99)); // Usando Value Object
  banana.estoque = 100;
  banana.disponivel = true;
  banana.ativo = true;
  banana.estabelecimento = estabelecimento;

  const maca = new Produto();
  maca.nome = "Maçã Fuji";
  maca.setPreco(Dinheiro.criar(5.50));
  maca.estoque = 50;
  maca.disponivel = true;
  maca.ativo = true;
  maca.estabelecimento = estabelecimento;

  // Criar pedido
  const pedido = new Pedido();
  pedido.clienteId = "cliente-123";
  pedido.status = StatusPedido.PAGAMENTO_PENDENTE;

  // Adicionar itens usando métodos do domínio rico
  try {
    pedido.adicionarItem(banana, 5); // 5 bananas
    pedido.adicionarItem(maca, 2);   // 2 maçãs
    
    console.log('✅ Itens adicionados com sucesso');
    console.log('💰 Valor total:', pedido.getValorTotal().formatado());
    
  } catch (error) {
    console.error('❌ Erro ao adicionar item:', error.message);
  }

  return pedido;
}

/**
 * Exemplo 2: Aplicando cupom com validações do domínio
 */
export async function exemploAplicarCupom(pedido: Pedido) {
  // Criar cupom de desconto
  const cupom = new Cupom();
  cupom.codigo = "DESCONTO10";
  cupom.valor = 10; // 10% de desconto
  cupom.tipoDesconto = TipoDesconto.PERCENTUAL;
  cupom.dataValidade = new Date('2025-12-31');
  cupom.ativo = true;
  cupom.valorMinimoCompra = 15.00;
  cupom.limitesUso = 100;
  cupom.vezesUsado = 0;

  try {
    // Método do domínio rico aplica validações
    pedido.aplicarCupom(cupom);
    
    console.log('✅ Cupom aplicado com sucesso');
    console.log('💰 Valor com desconto:', pedido.getValorTotal().formatado());
    console.log('🎫 Desconto aplicado:', pedido.getValorDesconto().formatado());
    
  } catch (error) {
    console.error('❌ Erro ao aplicar cupom:', error.message);
  }

  return pedido;
}

/**
 * Exemplo 3: Transições de status controladas pelo domínio
 */
export async function exemploTransicoesStatus(pedido: Pedido) {
  console.log('📋 Fluxo de status do pedido:');
  
  try {
    console.log(`🔄 Status atual: ${pedido.status}`);
    
    // Confirmar pedido (pagamento aprovado)
    pedido.confirmar();
    console.log(`✅ Pedido confirmado: ${pedido.status}`);
    
    // Iniciar preparação
    pedido.status = StatusPedido.EM_PREPARACAO;
    console.log(`👨‍🍳 Em preparação: ${pedido.status}`);
    
    // Enviar para entrega
    pedido.enviar();
    console.log(`🚚 Aguardando entregador: ${pedido.status}`);
    
    // Entregar
    pedido.entregar();
    console.log(`📦 Entregue: ${pedido.status}`);
    
  } catch (error) {
    console.error('❌ Erro na transição de status:', error.message);
  }
}

/**
 * Exemplo 4: Validações de estoque usando domínio rico
 */
export async function exemploValidacaoEstoque() {
  const produto = new Produto();
  produto.nome = "Laranja Lima";
  produto.setPreco(Dinheiro.criar(3.50));
  produto.estoque = 5; // Estoque baixo
  produto.disponivel = true;
  produto.ativo = true;

  const pedido = new Pedido();
  pedido.clienteId = "cliente-456";

  try {
    // Tentar adicionar mais itens do que há em estoque
    pedido.adicionarItem(produto, 10); // Vai dar erro!
    
  } catch (error) {
    console.error('❌ Validação de estoque:', error.message);
    console.log('📦 Estoque disponível:', produto.estoque);
  }

  try {
    // Adicionar quantidade válida
    pedido.adicionarItem(produto, 3);
    console.log('✅ Item adicionado dentro do estoque disponível');
    
    // Reduzir estoque após venda
    produto.reduzirEstoque(3);
    console.log('📦 Estoque após venda:', produto.estoque);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

/**
 * Exemplo 5: Operações com Value Object Dinheiro
 */
export function exemploValueObjectDinheiro() {
  console.log('💰 Exemplo com Value Object Dinheiro:');
  
  const preco1 = Dinheiro.criar(10.50);
  const preco2 = Dinheiro.criar(5.25);
  
  // Operações seguras
  const soma = preco1.somar(preco2);
  const subtracao = preco1.subtrair(preco2);
  
  console.log('Preço 1:', preco1.formatado());
  console.log('Preço 2:', preco2.formatado());
  console.log('Soma:', soma.formatado());
  console.log('Subtração:', subtracao.formatado());
  
  // Comparação
  console.log('São iguais?', preco1.equals(preco2));
  
  try {
    // Tentativa de criar valor inválido
    const precoInvalido = Dinheiro.criar(-10.00);
  } catch (error) {
    console.error('❌ Value Object protegeu:', error.message);
  }
}

/**
 * Exemplo 6: Gerenciamento de estabelecimento
 */
export function exemploEstabelecimento() {
  const loja = new Estabelecimento();
  loja.nome = "Supermercado Central";
  loja.ativo = true;
  loja.estaAberto = false; // Fechado inicialmente

  try {
    // Tentar abrir loja inativa
    loja.ativo = false;
    loja.abrir(); // Vai dar erro!
    
  } catch (error) {
    console.error('❌ Validação:', error.message);
  }

  // Ativar e abrir loja
  loja.ativo = true;
  loja.abrir();
  console.log('✅ Loja aberta:', loja.estaAberto);
  console.log('🛒 Pode vender?', loja.podeVender());

  // Fechar loja
  loja.fechar();
  console.log('❌ Loja fechada:', loja.estaAberto);
  console.log('🛒 Pode vender?', loja.podeVender());
}

/**
 * Função principal para executar todos os exemplos
 */
export async function executarExemplos() {
  console.log('🚀 Exemplos do Domínio Rico - 2-sales\n');
  
  console.log('1️⃣ Criando pedido com domínio rico:');
  const pedido = await exemploCreatePedidoRico();
  console.log('');
  
  console.log('2️⃣ Aplicando cupom:');
  await exemploAplicarCupom(pedido);
  console.log('');
  
  console.log('3️⃣ Transições de status:');
  await exemploTransicoesStatus(pedido);
  console.log('');
  
  console.log('4️⃣ Validação de estoque:');
  await exemploValidacaoEstoque();
  console.log('');
  
  console.log('5️⃣ Value Object Dinheiro:');
  exemploValueObjectDinheiro();
  console.log('');
  
  console.log('6️⃣ Gerenciamento de estabelecimento:');
  exemploEstabelecimento();
  console.log('');
  
  console.log('✨ Todos os exemplos executados!');
}

// Para executar: uncomment a linha abaixo
// executarExemplos().catch(console.error);
