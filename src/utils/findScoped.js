import { AppError } from './AppError.js';

// busca um registro que precisa pertencer a UM business especifico (nao so
// existir) - usado pra category/transaction, onde o dono do negocio nao e
// garantia suficiente de que o registro seja desse negocio em particular
export async function findScoped(model, id, businessId, notFoundMessage = 'Registro nao encontrado') {
  const record = await model.findFirst({ where: { id, businessId } });

  if (!record) {
    throw new AppError(404, notFoundMessage);
  }

  return record;
}
