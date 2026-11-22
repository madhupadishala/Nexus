import { Principal, ModuleId, Permission } from './types.js';
import { MODULES, PERMISSIONS } from '@nexus/core';

export function hasEntitlement(principal: Principal, module: ModuleId): boolean {
  return principal.entitlements.includes(module);
}

export function hasPermission(principal: Principal, permission: Permission): boolean {
  return principal.permissions.includes(permission);
}

export function requireEntitlement(principal: Principal, module: ModuleId): void {
  if (!hasEntitlement(principal, module)) {
    throw new EntitlementError(`Workspace not entitled for module: ${module}`);
  }
}

export function requirePermission(principal: Principal, permission: Permission): void {
  if (!hasPermission(principal, permission)) {
    throw new PermissionError(`Missing permission: ${permission}`);
  }
}

export class EntitlementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EntitlementError';
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export const MODULE_PERMISSIONS: Record<ModuleId, Permission[]> = {
  [MODULES.LITERATURE_SCREENING]: [PERMISSIONS.SCREENING_EXECUTE],
  [MODULES.INTAKE_TRIAGE]: [PERMISSIONS.INTAKE_CREATE, PERMISSIONS.INTAKE_TRIAGE],
  [MODULES.CASE_PROCESSING]: [PERMISSIONS.CASE_CREATE, PERMISSIONS.CASE_PROCESS],
  [MODULES.SUBMISSIONS]: [PERMISSIONS.SUBMISSION_GENERATE, PERMISSIONS.SUBMISSION_TRANSMIT],
  [MODULES.SIGNAL_MANAGEMENT]: [],
  [MODULES.AGGREGATE_REPORTING]: [],
  [MODULES.PV_DOCUMENTATION]: [],
};
