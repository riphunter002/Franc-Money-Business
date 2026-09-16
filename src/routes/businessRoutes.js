import { Router } from 'express';
import { BusinessController } from '../controllers/BusinessController.js';
import { SummaryController } from '../controllers/SummaryController.js';
import { AlertController } from '../controllers/AlertController.js';
import { auth } from '../middlewares/auth.js';
import { businessOwnership } from '../middlewares/businessOwnership.js';

export const businessRoutes = Router();

/**
 * @openapi
 * /businesses:
 *   post:
 *     summary: Cria um novo negocio para o usuario logado
 *     tags: [Business]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name: { type: string }
 *               type: { type: string, example: barbearia }
 *     responses:
 *       201: { description: Negocio criado }
 *   get:
 *     summary: Lista os negocios do usuario logado
 *     tags: [Business]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de negocios }
 */
businessRoutes.post('/', auth, BusinessController.create);
businessRoutes.get('/', auth, BusinessController.list);

/**
 * @openapi
 * /businesses/{businessId}:
 *   get:
 *     summary: Busca um negocio especifico do usuario logado
 *     tags: [Business]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Negocio encontrado }
 *       403: { description: Negocio pertence a outro usuario }
 *       404: { description: Negocio nao encontrado }
 */
businessRoutes.get('/:businessId', auth, businessOwnership, BusinessController.getOne);

/**
 * @openapi
 * /businesses/{businessId}/summary:
 *   get:
 *     summary: "Balanco do negocio num periodo (padrao: mes atual)"
 *     tags: [Summary]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: "{ period, income, expense, balance, byCategory }" }
 */
businessRoutes.get('/:businessId/summary', auth, businessOwnership, SummaryController.get);

/**
 * @openapi
 * /businesses/{businessId}/alerts:
 *   get:
 *     summary: "Categorias com gasto significativamente acima da media historica"
 *     tags: [Alerts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "{ alerts: [...] }" }
 */
businessRoutes.get('/:businessId/alerts', auth, businessOwnership, AlertController.list);

/**
 * @openapi
 * /businesses/{businessId}/history:
 *   get:
 *     summary: "Serie mensal de receita, despesa e saldo (padrao: 6 meses)"
 *     tags: [Summary]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 6, minimum: 2, maximum: 24 }
 *     responses:
 *       200: { description: "{ months: [{ month, income, expense, balance }] }" }
 */
businessRoutes.get('/:businessId/history', auth, businessOwnership, SummaryController.history);
