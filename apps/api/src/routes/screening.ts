import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ScreeningInput, ScreeningOutput, validateScreeningInput } from '@nexus/adapters';
import { createScreeningAdapter } from '@nexus/agents';

const ScreeningInputSchema = z.object({
  articleId: z.string().uuid(),
  articleTitle: z.string().min(1),
  articleAbstract: z.string().min(1),
  articleFullText: z.string().optional(),
  searchStrategyId: z.string().uuid(),
  workspaceId: z.string().uuid(),
});

export async function screeningRoutes(app: FastifyInstance) {
  const adapter = createScreeningAdapter();

  app.post('/screening/screen', async (request, reply) => {
    const parse = ScreeningInputSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.code(400).send({ error: 'Invalid input', details: parse.error.flatten() });
    }

    const input: ScreeningInput = parse.data;
    const validation = validateScreeningInput(input);
    if (!validation.valid) {
      return reply.code(400).send({ error: 'Validation failed', details: validation.errors });
    }

    const result = await adapter.execute(input, request.principal as any);
    
    return reply.send({
      data: result.data,
      evidence: result.evidence,
      warnings: result.warnings,
    });
  });

  app.get('/screening/strategies', async () => {
    return { strategies: [] };
  });
}
