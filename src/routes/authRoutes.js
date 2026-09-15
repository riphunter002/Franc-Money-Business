import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';

export const authRoutes = Router();

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Cadastra um novo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201: { description: Usuario criado, token retornado }
 *       409: { description: Email ja cadastrado }
 */
authRoutes.post('/users', UserController.register);

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Autentica um usuario existente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login bem sucedido, token retornado }
 *       401: { description: Credenciais invalidas }
 *       429: { description: Muitas tentativas, tente mais tarde }
 */
authRoutes.post('/login', loginRateLimiter, UserController.login);
