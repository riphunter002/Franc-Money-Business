import { z } from 'zod';
import prisma from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { findScoped } from '../utils/findScoped.js';

const CATEGORY_SELECT = { id: true, name: true, color: true, type: true };

const bulkCreateSchema = z.object({
  rows: z
    .array(
      z.object({
        description: z.string().trim().min(1, 'Descrição obrigatória').max(200),
        // negativo e aceito de proposito: numa fatura, credito/estorno vem
        // com sinal, e a tabela de espera guarda a linha COMO ELA VEIO do
        // arquivo. A regra "valor sempre positivo" e da Transaction e e
        // aplicada no confirm, nao aqui.
        amount: z.coerce.number().refine((v) => v !== 0, 'Valor não pode ser zero'),
        date: z.coerce.date(),
      }),
    )
    .min(1, 'Envie pelo menos uma linha'),
});

// todos opcionais: o usuario pode corrigir o que quiser antes de confirmar,
// e o que ele nao mexer continua valendo o que veio do arquivo.
// categoryId nao aceita null de proposito - "desmarcar" a categoria no
// momento de confirmar nao faz sentido, ja que ela e obrigatoria ali
const confirmSchema = z.object({
  description: z.string().trim().min(1, 'Descrição obrigatória').max(200).optional(),
  amount: z.coerce.number().positive('Valor deve ser maior que zero').optional(),
  date: z.coerce.date().optional(),
  categoryId: z.string().uuid('categoryId inválido').optional(),
});

export const ImportedTransactionController = {
  async bulkCreate(req, res) {
    const data = bulkCreateSchema.parse(req.body);

    const resultado = await prisma.importedTransaction.createMany({
      data: data.rows.map((row) => ({
        description: row.description,
        amount: row.amount,
        date: row.date,
        businessId: req.params.businessId,
      })),
    });

    res.status(201).json({ imported: resultado.count });
  },

  async list(req, res) {
    const pendentes = await prisma.importedTransaction.findMany({
      where: { businessId: req.params.businessId },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    res.json(pendentes);
  },

  async confirm(req, res) {
    const overrides = confirmSchema.parse(req.body ?? {});
    const pendente = await findScoped(
      prisma.importedTransaction,
      req.params.importedTransactionId,
      req.params.businessId,
      'Linha importada não encontrada',
    );

    const categoryId = overrides.categoryId ?? pendente.categoryId;
    if (!categoryId) {
      throw new AppError(400, 'Selecione uma categoria antes de confirmar.');
    }

    // findScoped aqui garante que a categoria e do MESMO negocio - sem isso
    // daria pra confirmar uma linha usando categoria de outro negocio
    const category = await findScoped(
      prisma.category,
      categoryId,
      req.params.businessId,
      'Categoria não encontrada para esse negócio',
    );

    // criar a transacao e apagar a pendencia precisam acontecer juntas:
    // se so uma passasse, ou a linha sumiria sem virar transacao, ou
    // apareceria duplicada na proxima revisao
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          description: overrides.description ?? pendente.description,
          // Math.abs fecha a invariante da Transaction no servidor: o valor e
          // sempre positivo e quem diz a direcao e o type da categoria. Vale
          // tanto pro credito que veio negativo do arquivo quanto pra um
          // negativo que o cliente mandasse por engano.
          amount: Math.abs(Number(overrides.amount ?? pendente.amount)),
          date: overrides.date ?? pendente.date,
          // type sempre vem da categoria, nunca do cliente (mesma regra do
          // TransactionController)
          type: category.type,
          categoryId: category.id,
          businessId: req.params.businessId,
        },
        include: { category: { select: CATEGORY_SELECT } },
      }),
      prisma.importedTransaction.delete({ where: { id: pendente.id } }),
    ]);

    res.status(201).json(transaction);
  },

  async discard(req, res) {
    await findScoped(
      prisma.importedTransaction,
      req.params.importedTransactionId,
      req.params.businessId,
      'Linha importada não encontrada',
    );

    await prisma.importedTransaction.delete({ where: { id: req.params.importedTransactionId } });
    res.status(204).send();
  },
};
