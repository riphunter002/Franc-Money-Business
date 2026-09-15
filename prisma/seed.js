import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';

const SEED_EMAIL = 'teste@francmoney.com';
const SEED_PASSWORD = 'senha123';

// gera uma data no dia `day` do mes atual - `monthsAgo` meses, em UTC -
// mesma convencao que a API usa ao interpretar uma data tipo "2026-09-01"
// vinda do cliente (string ISO so-de-data e sempre UTC, nunca hora local)
function dateMonthsAgo(monthsAgo, day) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, day));
}

async function main() {
  // apaga o usuario de teste (e, em cascata, seus businesses/categories/
  // transactions) para o seed poder rodar de novo sem duplicar dado
  await prisma.user.deleteMany({ where: { email: SEED_EMAIL } });

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      name: 'Lucas (usuario de teste)',
      email: SEED_EMAIL,
      passwordHash,
    },
  });

  // dois negocios para o mesmo usuario - o objetivo principal do seed e
  // dar dado pronto pra validar que um business nunca enxerga dado do outro
  const barbearia = await prisma.business.create({
    data: { name: 'Barbearia do Lucas', type: 'barbearia', ownerId: user.id },
  });

  const pizzaria = await prisma.business.create({
    data: { name: 'Pizzaria Bella', type: 'pizzaria', ownerId: user.id },
  });

  const [servicos, produtos, aluguelBarbearia, salarios] = await Promise.all([
    prisma.category.create({ data: { name: 'Serviços', type: 'INCOME', color: '#22C55E', businessId: barbearia.id } }),
    prisma.category.create({ data: { name: 'Produtos', type: 'EXPENSE', color: '#EF4444', businessId: barbearia.id } }),
    prisma.category.create({ data: { name: 'Aluguel', type: 'EXPENSE', color: '#F97316', businessId: barbearia.id } }),
    prisma.category.create({ data: { name: 'Salários', type: 'EXPENSE', color: '#3B82F6', businessId: barbearia.id } }),
  ]);

  const [vendas, ingredientes, aluguelPizzaria, entregadores] = await Promise.all([
    prisma.category.create({ data: { name: 'Vendas', type: 'INCOME', color: '#22C55E', businessId: pizzaria.id } }),
    prisma.category.create({ data: { name: 'Ingredientes', type: 'EXPENSE', color: '#EF4444', businessId: pizzaria.id } }),
    prisma.category.create({ data: { name: 'Aluguel', type: 'EXPENSE', color: '#F97316', businessId: pizzaria.id } }),
    prisma.category.create({ data: { name: 'Entregadores', type: 'EXPENSE', color: '#3B82F6', businessId: pizzaria.id } }),
  ]);

  // --- transacoes da barbearia: 3 meses de historico ---
  // "Produtos" fica estavel nos 2 meses anteriores (~200) e dispara no mes
  // atual (300, +50%) - dado pronto pra testar a regra de alerta (>30%)
  // quando a Etapa 6 for implementada.
  const barbeariaTransactions = [
    // mes atual (0 = este mes)
    { description: 'Cortes e barbas da semana', amount: 1800, type: 'INCOME', categoryId: servicos.id, monthsAgo: 0, day: 5 },
    { description: 'Cortes e barbas da semana', amount: 1650, type: 'INCOME', categoryId: servicos.id, monthsAgo: 0, day: 12 },
    { description: 'Compra de pomadas e shampoos', amount: 300, type: 'EXPENSE', categoryId: produtos.id, monthsAgo: 0, day: 8 },
    { description: 'Aluguel do ponto', amount: 1200, type: 'EXPENSE', categoryId: aluguelBarbearia.id, monthsAgo: 0, day: 5 },
    { description: 'Salário funcionário', amount: 1500, type: 'EXPENSE', categoryId: salarios.id, monthsAgo: 0, day: 5 },

    // 1 mes atras
    { description: 'Cortes e barbas do mes', amount: 3200, type: 'INCOME', categoryId: servicos.id, monthsAgo: 1, day: 15 },
    { description: 'Compra de produtos de higiene', amount: 190, type: 'EXPENSE', categoryId: produtos.id, monthsAgo: 1, day: 10 },
    { description: 'Aluguel do ponto', amount: 1200, type: 'EXPENSE', categoryId: aluguelBarbearia.id, monthsAgo: 1, day: 5 },
    { description: 'Salário funcionário', amount: 1500, type: 'EXPENSE', categoryId: salarios.id, monthsAgo: 1, day: 5 },

    // 2 meses atras
    { description: 'Cortes e barbas do mes', amount: 2950, type: 'INCOME', categoryId: servicos.id, monthsAgo: 2, day: 15 },
    { description: 'Compra de produtos de higiene', amount: 210, type: 'EXPENSE', categoryId: produtos.id, monthsAgo: 2, day: 10 },
    { description: 'Aluguel do ponto', amount: 1200, type: 'EXPENSE', categoryId: aluguelBarbearia.id, monthsAgo: 2, day: 5 },
    { description: 'Salário funcionário', amount: 1500, type: 'EXPENSE', categoryId: salarios.id, monthsAgo: 2, day: 5 },
  ];

  // --- transacoes da pizzaria: historico mais simples, so pra ter dado
  // suficiente pra validar isolamento entre os dois negocios ---
  const pizzariaTransactions = [
    { description: 'Vendas do fim de semana', amount: 4200, type: 'INCOME', categoryId: vendas.id, monthsAgo: 0, day: 7 },
    { description: 'Compra de queijo e molhos', amount: 900, type: 'EXPENSE', categoryId: ingredientes.id, monthsAgo: 0, day: 6 },
    { description: 'Aluguel do salão', amount: 1800, type: 'EXPENSE', categoryId: aluguelPizzaria.id, monthsAgo: 0, day: 5 },
    { description: 'Pagamento entregadores', amount: 600, type: 'EXPENSE', categoryId: entregadores.id, monthsAgo: 0, day: 8 },

    { description: 'Vendas do mes', amount: 8100, type: 'INCOME', categoryId: vendas.id, monthsAgo: 1, day: 15 },
    { description: 'Compra de ingredientes', amount: 2100, type: 'EXPENSE', categoryId: ingredientes.id, monthsAgo: 1, day: 12 },
    { description: 'Aluguel do salão', amount: 1800, type: 'EXPENSE', categoryId: aluguelPizzaria.id, monthsAgo: 1, day: 5 },
  ];

  await prisma.transaction.createMany({
    data: [...barbeariaTransactions, ...pizzariaTransactions].map((t) => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      categoryId: t.categoryId,
      businessId: [servicos.id, produtos.id, aluguelBarbearia.id, salarios.id].includes(t.categoryId)
        ? barbearia.id
        : pizzaria.id,
      date: dateMonthsAgo(t.monthsAgo, t.day),
    })),
  });

  console.log('Seed concluido:');
  console.log(`  Usuario: ${SEED_EMAIL} / senha: ${SEED_PASSWORD}`);
  console.log(`  Business 1: ${barbearia.name} (${barbearia.id})`);
  console.log(`  Business 2: ${pizzaria.name} (${pizzaria.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
