import { z } from 'zod';
import prisma from '../config/prisma.js';
import { findScoped } from '../utils/findScoped.js';

const CATEGORY_SELECT = { id: true, name: true, color: true, type: true };

const createTransactionSchema = z.object({
  description: z.string().trim().min(1, 'Descricao obrigatoria').max(200),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  date: z.coerce.date(),
  categoryId: z.string().uuid('categoryId invalido'),
});

const updateTransactionSchema = createTransactionSchema.partial();

const listQuerySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const TransactionController = {
  async create(req, res) {
    const data = createTransactionSchema.parse(req.body);

    // type nao vem do cliente - e sempre o mesmo da categoria escolhida,
    // pra nunca existir uma transacao contradizendo o tipo da sua categoria
    const category = await findScoped(prisma.category, data.categoryId, req.params.businessId, 'Categoria nao encontrada para esse negocio');

    const transaction = await prisma.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        date: data.date,
        type: category.type,
        categoryId: category.id,
        businessId: req.params.businessId,
      },
      include: { category: { select: CATEGORY_SELECT } },
    });

    res.status(201).json(transaction);
  },

  async list(req, res) {
    const query = listQuerySchema.parse(req.query);

    const where = { businessId: req.params.businessId };
    if (query.type) where.type = query.type;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = query.startDate;
      if (query.endDate) where.date.lte = query.endDate;
    }

    const [total, data] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { category: { select: CATEGORY_SELECT } },
      }),
    ]);

    res.json({
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(Math.ceil(total / query.limit), 1),
      },
    });
  },

  async update(req, res) {
    const data = updateTransactionSchema.parse(req.body);
    await findScoped(prisma.transaction, req.params.transactionId, req.params.businessId, 'Transacao nao encontrada');

    let type;
    if (data.categoryId) {
      const category = await findScoped(prisma.category, data.categoryId, req.params.businessId, 'Categoria nao encontrada para esse negocio');
      type = category.type;
    }

    const transaction = await prisma.transaction.update({
      where: { id: req.params.transactionId },
      data: { ...data, ...(type && { type }) },
      include: { category: { select: CATEGORY_SELECT } },
    });

    res.json(transaction);
  },

  async remove(req, res) {
    await findScoped(prisma.transaction, req.params.transactionId, req.params.businessId, 'Transacao nao encontrada');
    await prisma.transaction.delete({ where: { id: req.params.transactionId } });
    res.status(204).send();
  },
};
