import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    principal: {
      id: string;
      email: string;
      roles: string[];
      permissions: string[];
      tenantId: string;
      workspaceId: string;
      entitlements: string[];
    };
  }
}

export async function authPlugin(app: FastifyInstance) {
  app.addHook('onRequest', async (request) => {
    console.log('AUTH onRequest hook - URL:', request.url);
    (request as any).principal = {
      id: 'dev-user-1',
      email: 'dev@nexus.local',
      roles: ['safety_scientist'],
      permissions: ['screening:execute', 'intake:create', 'intake:triage', 'case:create', 'case:process'],
      tenantId: 'dev-tenant',
      workspaceId: 'dev-workspace',
      entitlements: ['literature-screening', 'intake-triage', 'case-processing', 'submissions'],
    };
    console.log('AUTH principal set:', (request as any).principal);
  });
}
