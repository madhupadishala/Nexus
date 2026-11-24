import { Principal } from '@nexus/auth';

export const testPrincipal: Principal = {
  id: 'eval-user-1',
  email: 'eval@nexus.local',
  name: 'Eval User',
  roles: ['safety_scientist'],
  permissions: ['screening:execute', 'intake:create', 'intake:triage', 'case:create', 'case:process'],
  tenantId: 'eval-tenant',
  workspaceId: 'eval-workspace',
  entitlements: ['literature-screening', 'intake-triage', 'case-processing', 'submissions'],
};

export const readOnlyPrincipal: Principal = {
  id: 'eval-readonly-1',
  email: 'eval-readonly@nexus.local',
  name: 'Eval ReadOnly',
  roles: ['read_only'],
  permissions: [],
  tenantId: 'eval-tenant',
  workspaceId: 'eval-workspace',
  entitlements: [],
};
