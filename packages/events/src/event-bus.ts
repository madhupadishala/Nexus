import { DomainEvent, EventHandler, EventBus, EventMetadata } from './types.js';

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map(h => h.handle(event)));
  }

  subscribe<T>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) handlers.splice(index, 1);
  }
}

export function createEvent<T>(
  eventType: string,
  aggregateId: string,
  aggregateType: string,
  payload: T,
  metadata: EventMetadata = {}
): DomainEvent<T> {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    aggregateId,
    aggregateType,
    payload,
    metadata: {
      ...metadata,
      timestamp: new Date(),
    } as EventMetadata & { timestamp: Date },
    timestamp: new Date(),
  };
}
