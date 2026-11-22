import { ModuleId, Permission, Role } from '@nexus/core';

export type { ModuleId, Permission, Role };

export interface Principal {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  permissions: Permission[];
  tenantId: string;
  workspaceId: string;
  entitlements: ModuleId[];
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  createdAt: Date;
  settings: TenantSettings;
}

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  jurisdiction: string;
  entitlements: ModuleId[];
  createdAt: Date;
}

export interface TenantSettings {
  dataResidencyRegion: string;
  defaultJurisdiction: string;
  ssoEnabled: boolean;
  ssoProvider?: 'auth0' | 'keycloak' | 'azure-ad';
}

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  workspaceId: string;
  permissions: Permission[];
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}
