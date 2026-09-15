import rateLimit from 'express-rate-limit';

// 5 tentativas FALHAS por IP a cada 15 min - so na rota de login, pra
// dificultar forca bruta de senha sem incomodar uso normal (cadastro nao
// tem limite).
//
// skipSuccessfulRequests faz o login que DEU CERTO nao consumir o limite.
// Sem isso, quem entra e sai do sistema algumas vezes no mesmo intervalo
// (ou testa a aplicacao) acaba bloqueado sem ter errado senha nenhuma -
// aconteceu de verdade durante os testes. A protecao continua igual: um
// ataque de forca bruta e, por definicao, feito de tentativas que falham.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
