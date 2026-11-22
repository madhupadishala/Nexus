export interface DomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: T;
  metadata: EventMetadata;
  timestamp: Date;
}

export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  tenantId?: string;
  workspaceId?: string;
  traceId?: string;
}

export interface EventHandler<T = unknown> {
  handle(event: DomainEvent<T>): Promise<void>;
}

export interface EventBus {
  publish<T>(event: DomainEvent<T>): Promise<void>;
  subscribe<T>(eventType: string, handler: EventHandler<T>): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
}

export interface OutboxEntry {
  id: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: unknown;
  metadata: EventMetadata;
  createdAt: Date;
  publishedAt?: Date;
  retryCount: number;
}
