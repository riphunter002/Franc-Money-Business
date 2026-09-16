import { z } from 'zod';
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

    // o negocio nasce sem categoria nenhuma de proposito: quem escolhe e o
    // usuario, na tela de Categorias, a partir das sugestoes - criar 11
    // categorias sem ele pedir era decidir por ele
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
