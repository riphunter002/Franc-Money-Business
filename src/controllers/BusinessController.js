import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '../config/defaultCategories.js';
import prisma from '../config/prisma.js';

const createBusinessSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  // string livre de proposito (ex: "barbearia", "pizzaria", "outro") -
  // nao trava futuros tipos de negocio numa enum fechada
  type: z.string().trim().min(2, 'Tipo deve ter pelo menos 2 caracteres').max(50),
});

export const BusinessController = {
  async create(req, res) {
    const data = createBusinessSchema.parse(req.body);

    // escrita aninhada: negocio + categorias padrao nascem numa unica
    // operacao atomica, entao nunca sobra um negocio sem categoria nenhuma
    // caso algo falhe no meio
    const business = await prisma.business.create({
      data: {
        name: data.name,
        type: data.type,
        ownerId: req.userId,
        categories: { create: DEFAULT_CATEGORIES },
      },
    });

    res.status(201).json(business);
  },

  async list(req, res) {
    const businesses = await prisma.business.findMany({
      where: { ownerId: req.userId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(businesses);
  },

  async getOne(req, res) {
    // req.business ja foi carregado e validado pelo middleware businessOwnership
    res.json(req.business);
  },
};
