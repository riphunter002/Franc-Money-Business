import prisma from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

// valida que o :businessId da rota pertence ao usuario autenticado
// (req.userId, ja definido pelo middleware `auth`). Deve ser aplicado em
// TODA rota que recebe :businessId - e a unica barreira entre um usuario
// e o dado financeiro de outro negocio que nao e dele.
export async function businessOwnership(req, res, next) {
  const { businessId } = req.params;

  const business = await prisma.business.findUnique({ where: { id: businessId } });

  if (!business) {
    throw new AppError(404, 'Negocio nao encontrado');
  }

  if (business.ownerId !== req.userId) {
    throw new AppError(403, 'Voce nao tem acesso a esse negocio');
  }

  req.business = business;
  next();
}
