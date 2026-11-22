import { AuditEntry, AuditLog, AuditQuery, VerificationResult } from './types.js';
import { EventBus, DomainEvent, createEvent } from '@nexus/events';
import * as crypto from 'crypto';

export class InMemoryAuditLog implements AuditLog {
  private entries: AuditEntry[] = [];
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  async append(entry: Omit<AuditEntry, 'id' | 'entryHash' | 'previousEntryHash'>): Promise<AuditEntry> {
    const previousEntry = this.entries[this.entries.length - 1];
    const previousEntryHash = previousEntry?.entryHash;

    const entryData = JSON.stringify({
      ...entry,
      previousEntryHash,
    });

    const entryHash = crypto.createHash('sha256').update(entryData).digest('hex');

    const auditEntry: AuditEntry = {
      ...entry,
      id: crypto.randomUUID(),
      entryHash,
      previousEntryHash,
    };

    this.entries.push(auditEntry);

    await this.eventBus.publish(
      createEvent('audit.entry.created', auditEntry.id, 'AuditEntry', auditEntry, {
        tenantId: auditEntry.tenantId,
        workspaceId: auditEntry.workspaceId,
      })
    );

    return auditEntry;
  }

  async query(filter: AuditQuery): Promise<AuditEntry[]> {
    let results = [...this.entries];

    if (filter.tenantId) results = results.filter(e => e.tenantId === filter.tenantId);
    if (filter.workspaceId) results = results.filter(e => e.workspaceId === filter.workspaceId);
    if (filter.userId) results = results.filter(e => e.userId === filter.userId);
    if (filter.action) results = results.filter(e => e.action === filter.action);
    if (filter.resourceType) results = results.filter(e => e.resourceType === filter.resourceType);
    if (filter.resourceId) results = results.filter(e => e.resourceId === filter.resourceId);
    if (filter.fromDate) results = results.filter(e => e.timestamp >= filter.fromDate!);
    if (filter.toDate) results = results.filter(e => e.timestamp <= filter.toDate!);

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter.offset) results = results.slice(filter.offset);
    if (filter.limit) results = results.slice(0, filter.limit);

    return results;
  }

  async verifyChain(fromId?: string, toId?: string): Promise<VerificationResult> {
    const details: string[] = [];
    let valid = true;
    let brokenAt: string | undefined;

    const entriesToVerify = fromId
      ? this.entries.filter(e => e.id === fromId || (toId && e.id === toId))
      : this.entries;

    for (let i = 0; i < entriesToVerify.length; i++) {
      const entry = entriesToVerify[i];
      const expectedPreviousHash = i > 0 ? entriesToVerify[i - 1].entryHash : undefined;

      if (entry.previousEntryHash !== expectedPreviousHash) {
        valid = false;
        brokenAt = entry.id;
        details.push(`Hash chain broken at ${entry.id}: expected previous ${expectedPreviousHash}, got ${entry.previousEntryHash}`);
      }

      const entryData = JSON.stringify({
        ...entry,
        previousEntryHash: entry.previousEntryHash,
      });
      const computedHash = crypto.createHash('sha256').update(entryData).digest('hex');
      if (entry.entryHash !== computedHash) {
        valid = false;
        brokenAt = entry.id;
        details.push(`Entry hash mismatch at ${entry.id}`);
      }
    }

    return { valid, brokenAt, details };
  }
}

export function createAuditEntry(params: {
  traceId: string;
  spanId: string;
  userId?: string;
  tenantId: string;
  workspaceId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
}): Omit<AuditEntry, 'id' | 'entryHash' | 'previousEntryHash'> {
  const hash = (data: unknown) => 
    data ? crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex') : undefined;

  return {
    timestamp: new Date(),
    traceId: params.traceId,
    spanId: params.spanId,
    userId: params.userId,
    tenantId: params.tenantId,
    workspaceId: params.workspaceId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    inputHash: hash(params.input),
    outputHash: hash(params.output),
    metadata: params.metadata || {},
  };
}
