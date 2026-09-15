import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

// precisa dos 4 parametros (err, req, res, next) mesmo sem usar `next` -
// e assim que o Express reconhece que essa e uma error-handling middleware
export function errorHandler(err, req, res, next) {
  // erro do body-parser do proprio Express quando o JSON do corpo da
  // requisicao esta malformado - sem esse caso especial, cai no branch
  // generico e vira 500 (erro do servidor), quando na verdade e erro de
  // quem chamou a API (corpo invalido)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // erro do Prisma: violacao de constraint unica (ex: email duplicado)
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Registro já existe' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}
