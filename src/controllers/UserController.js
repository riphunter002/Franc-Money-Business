import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(255),
  // 72 de proposito: bcrypt trunca silenciosamente qualquer coisa alem de
  // 72 bytes - sem esse limite explicito, uma senha maior passaria a
  // impressao de "mais segura" sem realmente ser
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(72, 'Senha deve ter no máximo 72 caracteres'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(255),
  password: z.string().min(1, 'Senha obrigatória').max(72),
});

function issueToken(userId) {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

export const UserController = {
  async register(req, res) {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, 'Já existe uma conta com esse e-mail');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash },
    });

    const token = issueToken(user.id);
    res.status(201).json({ token, user: toPublicUser(user) });
  },

  async login(req, res) {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    // mensagem identica para email inexistente e senha errada, de proposito -
    // nao da pra um atacante descobrir por tentativa quais emails tem conta
    const invalidCredentials = () => new AppError(401, 'Credenciais inválidas');

    if (!user) {
      throw invalidCredentials();
    }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatches) {
      throw invalidCredentials();
    }

    const token = issueToken(user.id);
    res.json({ token, user: toPublicUser(user) });
  },
};
