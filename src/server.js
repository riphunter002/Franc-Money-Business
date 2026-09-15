import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import env from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { authRoutes } from './routes/authRoutes.js';
import { businessRoutes } from './routes/businessRoutes.js';
import { categoryRoutes } from './routes/categoryRoutes.js';
import { transactionRoutes } from './routes/transactionRoutes.js';
import { auth } from './middlewares/auth.js';
import { businessOwnership } from './middlewares/businessOwnership.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Render fica na frente da aplicacao como um unico proxy reverso, injetando
// o IP real do cliente no header X-Forwarded-For. Sem isso, o Express usa o
// IP do proprio proxy do Render pra TODA requisicao - o rate limiter do
// login passa a contar tentativas de TODOS os usuarios juntos num balde so,
// em vez de por pessoa (confirmado em producao antes desse fix).
// Valor "1" = confia em exatamente um hop de proxy, que e o setup do Render;
// um valor maior (ou "true", que confia em qualquer numero de hops)
// permitiria forjar o X-Forwarded-For pra burlar o rate limit.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(authRoutes);
app.use('/businesses', businessRoutes);
app.use('/businesses/:businessId/categories', auth, businessOwnership, categoryRoutes);
app.use('/businesses/:businessId/transactions', auth, businessOwnership, transactionRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada' });
});

// tem que ser o ultimo app.use - middleware de erro precisa vir depois de
// todas as rotas pra capturar o que elas (ou o Express) jogarem
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Servidor rodando em http://localhost:${env.PORT}`);
  console.log(`Documentacao em http://localhost:${env.PORT}/api-docs`);
});
