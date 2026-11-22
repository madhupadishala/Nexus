import { Principal } from '@nexus/auth';

export interface AgentConfig {
  agentId: string;
  name: string;
  version: string;
  capabilities: string[];
  timeoutMs: number;
  retries: number;
}

export interface AgentInput<TPayload = unknown> {
  payload: TPayload;
  principal: Principal;
  context: Record<string, unknown>;
  traceId: string;
  spanId: string;
}

export interface AgentOutput<TResult = unknown> {
  result: TResult;
  evidence: Evidence[];
  metrics: AgentMetrics;
  warnings: string[];
}

export interface Evidence {
  type: 'source' | 'reasoning' | 'tool' | 'human';
  source: string;
  content: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface AgentMetrics {
  durationMs: number;
  tokensUsed?: { input: number; output: number; total: number };
  modelUsed?: string;
  retryCount: number;
}

export interface BaseAgent {
  config: AgentConfig;
  execute(input: AgentInput): Promise<AgentOutput>;
  validateInput(input: AgentInput): boolean;
  getCapabilities(): string[];
}

export interface AgentAdapter<TInput, TOutput> {
  readonly agentId: string;
  readonly version: string;
  execute(input: TInput, principal: Principal): Promise<AdapterResult<TOutput>>;
  validateInput(input: TInput): ValidationResult;
}

export interface AdapterResult<T> {
  data: T;
  evidence: Evidence[];
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ModelGateway {
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  embed(texts: string[]): Promise<number[][]>;
}

export interface CompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export interface CompletionResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  model: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface Tool {
  type: 'function';
  function: { name: string; description: string; parameters: object };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}
