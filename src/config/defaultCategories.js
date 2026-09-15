// Categorias que todo negocio novo ja nasce tendo, pra ninguem precisar
// cadastrar o basico antes de lancar a primeira transacao. O usuario pode
// editar, excluir (enquanto nao houver transacao) e criar as do nicho dele.
//
// As cores das DESPESAS seguem a ordem fixa da paleta categorica validada
// (azul, laranja, aqua, amarelo, magenta, verde, vermelho, violeta) - e
// justamente esse conjunto que forma o ranking de "Gastos por categoria"
// no painel, entao a ordem importa pra manter as barras distinguiveis,
// inclusive por quem tem daltonismo.
//
// As RECEITAS usam tons deliberadamente fora dessa paleta: elas nunca
// aparecem no mesmo grafico que as despesas, mas dividem espaco na lista
// de categorias e nos pontinhos da tabela de transacoes - tons distintos
// evitam duas categorias diferentes com a mesma cor lado a lado.
export const DEFAULT_CATEGORIES = [
  { name: 'Vendas', type: 'INCOME', color: '#0F766E' },
  { name: 'Serviços', type: 'INCOME', color: '#7C3AED' },
  { name: 'Outras receitas', type: 'INCOME', color: '#92400E' },

  { name: 'Fornecedores', type: 'EXPENSE', color: '#2A78D6' },
  { name: 'Aluguel', type: 'EXPENSE', color: '#EB6834' },
  { name: 'Salários', type: 'EXPENSE', color: '#1BAF7A' },
  { name: 'Contas (água, luz, internet)', type: 'EXPENSE', color: '#EDA100' },
  { name: 'Marketing', type: 'EXPENSE', color: '#E87BA4' },
  { name: 'Impostos', type: 'EXPENSE', color: '#008300' },
  { name: 'Manutenção', type: 'EXPENSE', color: '#E34948' },
  { name: 'Outras despesas', type: 'EXPENSE', color: '#4A3AA7' },
];
