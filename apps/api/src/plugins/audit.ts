import { FastifyInstance } from 'fastify';

export async function auditPlugin(app: FastifyInstance) {
  app.addHook('onResponse', async (request, reply) => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      traceId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      userId: request.principal?.id,
      tenantId: request.principal?.tenantId,
      workspaceId: request.principal?.workspaceId,
    };
    app.log.info({ audit: auditEntry }, 'API request');
  });
}
