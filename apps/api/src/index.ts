import Fastify from 'fastify';
import { screeningRoutes } from './routes/screening.js';

async function main() {
  const app = Fastify({ logger: true });

  // Register auth hook FIRST
  app.addHook('onRequest', async (request) => {
    console.log('AUTH HOOK - URL:', request.url);
    (request as any).principal = {
      id: 'dev-user-1',
      email: 'dev@nexus.local',
      roles: ['safety_scientist'],
      permissions: ['screening:execute', 'intake:create', 'intake:triage', 'case:create', 'case:process'],
      tenantId: 'dev-tenant',
      workspaceId: 'dev-workspace',
      entitlements: ['literature-screening', 'intake-triage', 'case-processing', 'submissions'],
    };
    console.log('AUTH HOOK - Principal set');
  });

  // Entitlement guard
  app.addHook('preHandler', async (request, reply) => {
    console.log('ENTITLEMENT GUARD - URL:', request.url);
    
    if (request.url.startsWith('/health')) return;

    const principal = (request as any).principal;
    console.log('ENTITLEMENT GUARD - Principal:', principal);
    
    if (!principal) {
      console.log('ENTITLEMENT GUARD - No principal');
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const moduleMatch = request.url.match(/^\/api\/v1\/(\w+)/);
    if (!moduleMatch) return;

    const module = moduleMatch[1];
    const MODULES = {
      LITERATURE_SCREENING: 'literature-screening',
      INTAKE_TRIAGE: 'intake-triage',
      CASE_PROCESSING: 'case-processing',
      SUBMISSIONS: 'submissions',
      SIGNAL_MANAGEMENT: 'signal-management',
      AGGREGATE_REPORTING: 'aggregate-reporting',
      PV_DOCUMENTATION: 'pv-documentation',
    } as const;
    
    const moduleId = MODULES[module as keyof typeof MODULES];
    if (!moduleId) return;

    const MODULE_PERMISSIONS = {
      'literature-screening': ['screening:execute'],
      'intake-triage': ['intake:create', 'intake:triage'],
      'case-processing': ['case:create', 'case:process'],
      'submissions': ['submission:generate', 'submission:transmit'],
      'signal-management': [],
      'aggregate-reporting': [],
      'pv-documentation': [],
    };

    const requiredPermissions = MODULE_PERMISSIONS[moduleId];
    if (requiredPermissions?.length) {
      const hasPerm = requiredPermissions.some(p => principal.permissions.includes(p));
      if (!hasPerm) {
        console.log('ENTITLEMENT GUARD - Missing permission');
        return reply.code(403).send({ error: `Missing required permission for ${moduleId}` });
      }
    }
    console.log('ENTITLEMENT GUARD - Passed');
  });

  await app.register(screeningRoutes, { prefix: '/api/v1' });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`API listening on ${port}`);
}

main().catch(console.error);
