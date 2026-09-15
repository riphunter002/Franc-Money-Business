import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController.js';

export const transactionRoutes = Router({ mergeParams: true });

/**
 * @openapi
 * /businesses/{businessId}/transactions:
 *   post:
 *     summary: Cria uma transacao para o negocio
 *     tags: [Transaction]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description, amount, date, categoryId]
 *             properties:
 *               description: { type: string }
 *               amount: { type: number, example: 150.5 }
 *               date: { type: string, format: date-time }
 *               categoryId: { type: string }
 *     responses:
 *       201: { description: Transacao criada (type e copiado da categoria) }
 *   get:
 *     summary: Lista transacoes do negocio, com filtros e paginacao
 *     tags: [Transaction]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [INCOME, EXPENSE] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: "{ data, meta } paginado" }
 */
transactionRoutes.post('/', TransactionController.create);
transactionRoutes.get('/', TransactionController.list);

/**
 * @openapi
 * /businesses/{businessId}/transactions/{transactionId}:
 *   put:
 *     summary: Atualiza uma transacao do negocio
 *     tags: [Transaction]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Transacao atualizada }
 *       404: { description: Transacao nao encontrada nesse negocio }
 *   delete:
 *     summary: Remove uma transacao do negocio
 *     tags: [Transaction]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Transacao removida }
 */
transactionRoutes.put('/:transactionId', TransactionController.update);
transactionRoutes.delete('/:transactionId', TransactionController.remove);
