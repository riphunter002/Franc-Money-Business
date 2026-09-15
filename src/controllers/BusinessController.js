import { z } from 'zod';
import prisma from '../config/prisma.js';

const createBusinessSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  // string livre de proposito (ex: "barbearia", "pizzaria", "outro") -
  // nao trava futuros tipos de negocio numa enum fechada
  type: z.string().trim().min(2, 'Tipo deve ter pelo menos 2 caracteres'),
});

export const BusinessController = {
  async create(req, res) {
    const data = createBusinessSchema.parse(req.body);

    const business = await prisma.business.create({
      data: { name: data.name, type: data.type, ownerId: req.userId },
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
