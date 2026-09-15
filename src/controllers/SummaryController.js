import { z } from 'zod';
import prisma from '../config/prisma.js';

const summaryQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

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
};
