import rateLimit from 'express-rate-limit';

// 5 tentativas por IP a cada 15 min - so na rota de login, pra dificultar
// forca bruta de senha sem incomodar uso normal (cadastro nao tem limite)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
