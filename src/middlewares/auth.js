import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import prisma from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

// valida o JWT e expoe o id do usuario autenticado em req.userId.
// NAO valida acesso a nenhum business especifico - isso e responsabilidade
// do middleware businessOwnership (Etapa 3), que roda depois deste.
export async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'Token nao informado');
  }

  const token = header.slice('Bearer '.length);

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError(401, 'Token invalido ou expirado');
  }

  // confirma que o usuario ainda existe - um token so prova que foi emitido
  // validamente no passado, nao que a conta ainda existe agora
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true } });
  if (!user) {
    throw new AppError(401, 'Usuario nao encontrado');
  }

  req.userId = payload.userId;
  next();
}
