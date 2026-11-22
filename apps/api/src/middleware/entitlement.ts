import { FastifyRequest, FastifyReply } from 'fastify';
import { requireEntitlement, MODULE_PERMISSIONS } from '@nexus/auth';
import { MODULES } from '@nexus/core';

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

export async function entitlementGuard(request: FastifyRequest, reply: FastifyReply) {
  console.log('Middleware called for:', request.url);
  console.log('Principal:', (request as any).principal);
  
  if (request.url.startsWith('/health')) return;

  const principal = (request as any).principal;
  if (!principal) {
    console.log('No principal found');
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const moduleMatch = request.url.match(/^\/api\/v1\/(\w+)/);
  if (!moduleMatch) return;

  const module = moduleMatch[1] as keyof typeof MODULES;
  const moduleId = MODULES[module as keyof typeof MODULES];
  if (!moduleId) return;

  try {
    requireEntitlement(principal, moduleId);
    const permissions = MODULE_PERMISSIONS[moduleId];
    if (permissions?.length) {
      const hasPerm = permissions.some((p: string) => principal.permissions.includes(p));
      if (!hasPerm) {
        return reply.code(403).send({ error: `Missing required permission for ${moduleId}` });
      }
    }
  } catch (e) {
    return reply.code(403).send({ error: e instanceof Error ? e.message : 'Forbidden' });
  }
}
