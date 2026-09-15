import prisma from '../config/prisma.js';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// constantes da regra - de proposito num lugar so e facil de ajustar depois
// sem mexer na logica
const ALERT_THRESHOLD_PERCENTAGE = 30;
const ALERT_MIN_ABSOLUTE_DIFFERENCE = 50;
const MIN_HISTORY_MONTHS = 2;
const HISTORY_WINDOW_MONTHS = 3;

// tudo em UTC de proposito: uma data tipo "2026-09-01" vinda da API vira
// meia-noite UTC (regra do JS pra strings ISO so-de-data). Se a extracao
// usasse getDate()/getMonth() (hora LOCAL do servidor), um dia 1 podia
// virar "dia 31 do mes anterior" dependendo do fuso do servidor - foi
// exatamente o bug encontrado e reproduzido antes desse fix.
function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export const AlertController = {
  async list(req, res) {
    const today = new Date();
    const currentDay = today.getUTCDate();

    // busca so ate HISTORY_WINDOW_MONTHS meses atras - o suficiente pro
    // maior historico que a regra usa
    const oldestMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - HISTORY_WINDOW_MONTHS, 1));

    const [transactions, categories] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          businessId: req.params.businessId,
          type: 'EXPENSE',
          date: { gte: oldestMonthStart, lte: today },
        },
        select: { categoryId: true, amount: true, date: true },
      }),
      prisma.category.findMany({ where: { businessId: req.params.businessId, type: 'EXPENSE' } }),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // buckets[categoryId] = { current: number, history: { [monthsAgo]: number } }
    // so entram no bucket os dias EQUIVALENTES ao mes atual (ex: se hoje e
    // dia 15, cada mes anterior so soma ate o proprio dia 15) - senao um
    // mes parcial seria injustamente comparado a meses inteiros
    const buckets = new Map();

    for (const tx of transactions) {
      const monthsAgo = (today.getUTCFullYear() - tx.date.getUTCFullYear()) * 12 + (today.getUTCMonth() - tx.date.getUTCMonth());
      const cutoffDay = monthsAgo === 0 ? currentDay : Math.min(currentDay, daysInMonth(tx.date.getUTCFullYear(), tx.date.getUTCMonth()));

      if (tx.date.getUTCDate() > cutoffDay) continue;

      if (!buckets.has(tx.categoryId)) {
        buckets.set(tx.categoryId, { current: 0, history: {} });
      }
      const bucket = buckets.get(tx.categoryId);
      const amount = Number(tx.amount);

      if (monthsAgo === 0) {
        bucket.current += amount;
      } else if (monthsAgo >= 1 && monthsAgo <= HISTORY_WINDOW_MONTHS) {
        bucket.history[monthsAgo] = (bucket.history[monthsAgo] ?? 0) + amount;
      }
    }

    const alerts = [];

    for (const [categoryId, bucket] of buckets) {
      const historyValues = Object.values(bucket.history);

      // categoria sem gasto em pelo menos 2 dos meses anteriores nao tem
      // historico suficiente pra confiar numa media - nao avalia
      if (historyValues.length < MIN_HISTORY_MONTHS) continue;

      const average = historyValues.reduce((sum, v) => sum + v, 0) / historyValues.length;
      const difference = bucket.current - average;
      const percentageAboveAverage = (difference / average) * 100;

      const isSignificant = percentageAboveAverage > ALERT_THRESHOLD_PERCENTAGE && difference >= ALERT_MIN_ABSOLUTE_DIFFERENCE;
      if (!isSignificant) continue;

      const category = categoryMap.get(categoryId);
      alerts.push({
        categoryId,
        name: category.name,
        color: category.color,
        currentAmount: Number(bucket.current.toFixed(2)),
        averageAmount: Number(average.toFixed(2)),
        difference: Number(difference.toFixed(2)),
        percentageAboveAverage: Math.round(percentageAboveAverage),
        historyMonths: historyValues.length,
        message: `Você gastou ${Math.round(percentageAboveAverage)}% a mais em ${category.name} este mês (R$ ${currencyFormatter.format(bucket.current)}) comparado à média dos últimos ${historyValues.length} meses (R$ ${currencyFormatter.format(average)}).`,
      });
    }

    // maior diferenca em reais primeiro - e o que tem mais impacto real no
    // caixa do negocio, nao necessariamente o maior percentual
    alerts.sort((a, b) => b.difference - a.difference);

    res.json({ alerts });
  },
};
