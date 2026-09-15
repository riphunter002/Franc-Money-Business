import swaggerJsdoc from 'swagger-jsdoc';
import env from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Franc Money Business API',
      version: '0.1.0',
      description: 'API de gestao financeira multi-tenant para pequenos negocios',
    },
    servers: [{ url: `http://localhost:${env.PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  // le as anotacoes @openapi direto dos arquivos de rota
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
