export interface AuditEntry {
  id: string;
  timestamp: Date;
  traceId: string;
  spanId: string;
  userId?: string;
  tenantId: string;
  workspaceId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  inputHash?: string;
  outputHash?: string;
  metadata: Record<string, unknown>;
  previousEntryHash?: string;
  entryHash: string;
}

export interface AuditLog {
  append(entry: Omit<AuditEntry, 'id' | 'entryHash' | 'previousEntryHash'>): Promise<AuditEntry>;
  query(filter: AuditQuery): Promise<AuditEntry[]>;
  verifyChain(fromId?: string, toId?: string): Promise<VerificationResult>;
}

export interface AuditQuery {
  tenantId?: string;
  workspaceId?: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface VerificationResult {
  valid: boolean;
  brokenAt?: string;
  details: string[];
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  leaf?: AuditEntry;
}
