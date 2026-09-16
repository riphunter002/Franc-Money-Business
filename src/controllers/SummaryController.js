import { z } from 'zod';
import prisma from '../config/prisma.js';

const summaryQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const historyQuerySchema = z.object({
  months: z.coerce.number().int().min(2).max(24).default(6),
});

function chaveDoMes(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

// UTC de proposito - mesma razao do AlertController: nao depender do fuso
// horario configurado no servidor onde o processo roda
function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

export const SummaryController = {
  async get(req, res) {
    const query = summaryQuerySchema.parse(req.query);
    const defaultRange = currentMonthRange();

    const dateFilter = {
      gte: query.startDate ?? defaultRange.start,
      lte: query.endDate ?? defaultRange.end,
    };

    const where = { businessId: req.params.businessId, date: dateFilter };

    const [byType, categories, byCategoryRaw] = await Promise.all([
      prisma.transaction.groupBy({ by: ['type'], where, _sum: { amount: true } }),
      prisma.category.findMany({ where: { businessId: req.params.businessId } }),
      prisma.transaction.groupBy({ by: ['categoryId'], where, _sum: { amount: true } }),
    ]);

    const income = Number(byType.find((t) => t.type === 'INCOME')?._sum.amount ?? 0);
    const expense = Number(byType.find((t) => t.type === 'EXPENSE')?._sum.amount ?? 0);
    const balance = Number((income - expense).toFixed(2));

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // categoryId aqui sempre resolve pra uma categoria do MESMO business -
    // e garantido na criacao da transacao (TransactionController), entao
    // nao precisa de fallback pra categoria "nao encontrada"
    const byCategory = byCategoryRaw
      .map((row) => {
        const category = categoryMap.get(row.categoryId);
        return {
          categoryId: row.categoryId,
          name: category.name,
          color: category.color,
          type: category.type,
          total: Number(row._sum.amount ?? 0),
        };
      })
      .sort((a, b) => b.total - a.total);

    res.json({
      period: { start: dateFilter.gte, end: dateFilter.lte },
      income,
      expense,
      balance,
      byCategory,
    });
  },

  // serie mensal pro grafico de evolucao do painel
  async history(req, res) {
    const { months } = historyQuerySchema.parse(req.query);
    const now = new Date();

    // comeca no primeiro dia do mes de (months - 1) meses atras, em UTC
    const inicio = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
    const fim = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    // mesma abordagem do AlertController: uma consulta so e o agrupamento
    // por mes feito em JS. Prisma nao agrupa por mes sem SQL cru, e o
    // volume de um pequeno negocio nao justifica essa complexidade
    const transactions = await prisma.transaction.findMany({
      where: { businessId: req.params.businessId, date: { gte: inicio, lte: fim } },
      select: { amount: true, type: true, date: true },
    });

    // monta todos os meses do intervalo, inclusive os sem movimentacao -
    // senao o grafico "pularia" meses vazios e distorceria a leitura
    const baldes = new Map();
    for (let i = 0; i < months; i += 1) {
      const mes = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1) + i, 1));
      baldes.set(chaveDoMes(mes), { month: chaveDoMes(mes), income: 0, expense: 0 });
    }

    for (const tx of transactions) {
      const balde = baldes.get(chaveDoMes(tx.date));
      if (!balde) continue;
      const valor = Number(tx.amount);
      if (tx.type === 'INCOME') balde.income += valor;
      else balde.expense += valor;
    }

    const serie = [...baldes.values()].map((balde) => ({
      month: balde.month,
      income: Number(balde.income.toFixed(2)),
      expense: Number(balde.expense.toFixed(2)),
      balance: Number((balde.income - balde.expense).toFixed(2)),
    }));

    res.json({ months: serie });
  },
};
