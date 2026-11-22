import { BaseAgent, AgentConfig, AgentInput, AgentOutput, AgentAdapter, AdapterResult, ValidationResult, Evidence } from './types.js';

export abstract class AbstractBaseAgent implements BaseAgent {
  public readonly config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  abstract execute(input: AgentInput): Promise<AgentOutput>;

  validateInput(input: AgentInput): boolean {
    return true;
  }

  getCapabilities(): string[] {
    return this.config.capabilities;
  }

  protected createOutput<T>(
    result: T,
    evidence: Evidence[] = [],
    metrics: AgentOutput['metrics'],
    warnings: string[] = []
  ): AgentOutput<T> {
    return { result, evidence, metrics, warnings };
  }
}

export class AdapterWrapperAgent<TInput, TOutput> extends AbstractBaseAgent {
  private adapter: AgentAdapter<TInput, TOutput>;
  private transformInput: (input: AgentInput) => TInput;

  constructor(
    config: AgentConfig,
    adapter: AgentAdapter<TInput, TOutput>,
    transformInput: (input: AgentInput) => TInput
  ) {
    super(config);
    this.adapter = adapter;
    this.transformInput = transformInput;
  }

  async execute(input: AgentInput): Promise<AgentOutput<TOutput>> {
    const adapted = this.transformInput(input);
    const validation = this.adapter.validateInput(adapted);
    if (!validation.valid) {
      throw new Error(`Invalid input for ${this.adapter.agentId}: ${validation.errors.join(', ')}`);
    }
    const result = await this.adapter.execute(adapted, input.principal);
    return this.createOutput(
      result.data,
      result.evidence,
      { durationMs: 0, retryCount: 0 },
      result.warnings
    );
  }
}

export function adapterToBaseAgent<TInput, TOutput>(
  adapter: AgentAdapter<TInput, TOutput>,
  config: AgentConfig,
  transformInput: (input: AgentInput) => TInput
): BaseAgent {
  return new AdapterWrapperAgent(config, adapter, transformInput);
}
