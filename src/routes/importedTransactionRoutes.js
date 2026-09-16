import { Router } from 'express';
import { ImportedTransactionController } from '../controllers/ImportedTransactionController.js';

export const importedTransactionRoutes = Router({ mergeParams: true });

/**
 * @openapi
 * /businesses/{businessId}/imported-transactions:
 *   post:
 *     summary: Envia as linhas lidas de um arquivo para revisao
 *     tags: [Importacao]
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
 *             required: [rows]
 *             properties:
 *               rows:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [description, amount, date]
 *                   properties:
 *                     description: { type: string }
 *                     amount: { type: number, example: 150.5 }
 *                     date: { type: string, format: date }
 *     responses:
 *       201: { description: "{ imported: <quantidade> }" }
 *   get:
 *     summary: Lista as linhas importadas aguardando revisao
 *     tags: [Importacao]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Linhas pendentes de revisao }
 */
importedTransactionRoutes.post('/', ImportedTransactionController.bulkCreate);
importedTransactionRoutes.get('/', ImportedTransactionController.list);

/**
 * @openapi
 * /businesses/{businessId}/imported-transactions/{importedTransactionId}/confirm:
 *   post:
 *     summary: Vira a linha importada numa transacao de verdade
 *     tags: [Importacao]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description: { type: string }
 *               amount: { type: number }
 *               date: { type: string, format: date }
 *               categoryId: { type: string }
 *     responses:
 *       201: { description: Transacao criada (type copiado da categoria) }
 *       400: { description: Linha sem categoria definida }
 *       404: { description: Linha nao encontrada nesse negocio }
 */
importedTransactionRoutes.post('/:importedTransactionId/confirm', ImportedTransactionController.confirm);

/**
 * @openapi
 * /businesses/{businessId}/imported-transactions/{importedTransactionId}:
 *   delete:
 *     summary: Descarta uma linha importada sem virar transacao
 *     tags: [Importacao]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Linha descartada }
 *       404: { description: Linha nao encontrada nesse negocio }
 */
importedTransactionRoutes.delete('/:importedTransactionId', ImportedTransactionController.discard);
