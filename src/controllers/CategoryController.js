import { z } from 'zod';
import prisma from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { findScoped } from '../utils/findScoped.js';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().regex(HEX_COLOR, 'Cor deve ser um hex valido, ex: #22C55E'),
});

const updateCategorySchema = createCategorySchema.partial();

export const CategoryController = {
  async create(req, res) {
    const data = createCategorySchema.parse(req.body);

    const category = await prisma.category.create({
      data: { ...data, businessId: req.params.businessId },
    });

    res.status(201).json(category);
  },

  async list(req, res) {
    const categories = await prisma.category.findMany({
      where: { businessId: req.params.businessId },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  },

  async update(req, res) {
    const data = updateCategorySchema.parse(req.body);
    const current = await findScoped(prisma.category, req.params.categoryId, req.params.businessId, 'Categoria nao encontrada');

    if (data.type && data.type !== current.type) {
      const transactionCount = await prisma.transaction.count({
        where: { categoryId: req.params.categoryId },
      });

      // transaction.type e copiado da categoria so na criacao (Etapa 4) -
      // se o tipo da categoria mudasse depois, as transacoes antigas
      // ficariam com um type que nao bate mais com a categoria atual, o
      // que quebra a leitura de /summary e /alerts (chegam a derrubar o
      // endpoint com erro 500, confirmado em teste)
      if (transactionCount > 0) {
        throw new AppError(409, 'Nao e possivel mudar o tipo de uma categoria que ja tem transacoes.');
      }
    }

    const category = await prisma.category.update({
      where: { id: req.params.categoryId },
      data,
    });

    res.json(category);
  },

  async remove(req, res) {
    await findScoped(prisma.category, req.params.categoryId, req.params.businessId, 'Categoria nao encontrada');

    const transactionCount = await prisma.transaction.count({
      where: { categoryId: req.params.categoryId },
    });

    if (transactionCount > 0) {
      throw new AppError(409, 'Nao e possivel excluir uma categoria com transacoes. Exclua ou reclassifique as transacoes primeiro.');
    }

    await prisma.category.delete({ where: { id: req.params.categoryId } });
    res.status(204).send();
  },
};
