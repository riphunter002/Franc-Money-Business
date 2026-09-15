import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController.js';

// mergeParams: true - sem isso, este router nao enxergaria o :businessId
// declarado no app.use() onde ele e montado (server.js)
export const categoryRoutes = Router({ mergeParams: true });

/**
 * @openapi
 * /businesses/{businessId}/categories:
 *   post:
 *     summary: Cria uma categoria para o negocio
 *     tags: [Category]
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
 *             required: [name, type, color]
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [INCOME, EXPENSE] }
 *               color: { type: string, example: "#22C55E" }
 *     responses:
 *       201: { description: Categoria criada }
 *   get:
 *     summary: Lista as categorias do negocio
 *     tags: [Category]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de categorias }
 */
categoryRoutes.post('/', CategoryController.create);
categoryRoutes.get('/', CategoryController.list);

/**
 * @openapi
 * /businesses/{businessId}/categories/{categoryId}:
 *   put:
 *     summary: Atualiza uma categoria do negocio
 *     tags: [Category]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Categoria atualizada }
 *       404: { description: Categoria nao encontrada nesse negocio }
 *   delete:
 *     summary: Remove uma categoria do negocio (falha se houver transacoes)
 *     tags: [Category]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Categoria removida }
 *       409: { description: Categoria possui transacoes }
 */
categoryRoutes.put('/:categoryId', CategoryController.update);
categoryRoutes.delete('/:categoryId', CategoryController.remove);
