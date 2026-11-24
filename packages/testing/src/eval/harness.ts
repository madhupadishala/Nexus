import { GoldenTestCase, EvalResult, EvalSuiteResult, EvalConfig } from './types.js';
import { AgentAdapter, AgentInput } from '@nexus/agent-runtime';
import { Principal } from '@nexus/auth';

export class EvalHarness<TInput, TOutput> {
  private config: EvalConfig<TInput, TOutput>;
  private testCases: GoldenTestCase<TInput, TOutput>[] = [];

  constructor(config: EvalConfig<TInput, TOutput>) {
    this.config = config;
  }

  addTestCase(testCase: GoldenTestCase<TInput, TOutput>): void {
    this.testCases.push(testCase);
  }

  addTestCases(testCases: GoldenTestCase<TInput, TOutput>[]): void {
    this.testCases.push(...testCases);
  }

  async loadFromFile(filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    this.testCases = data.testCases || data;
  }

  async run(): Promise<EvalSuiteResult> {
    const startTime = Date.now();
    const results: EvalResult<TOutput>[] = [];

    for (const testCase of this.testCases) {
      const result = await this.runSingleTest(testCase);
      results.push(result);
    }

    const passed = results.filter(r => r.passed).length;
    const totalCases = results.length;
    const passRate = totalCases > 0 ? passed / totalCases : 0;
    const avgScore = totalCases > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / totalCases
      : 0;

    return {
      suiteName: this.config.agentAdapter.agentId,
      totalCases,
      passed,
      failed: totalCases - passed,
      passRate,
      avgScore,
      results,
      durationMs: Date.now() - startTime,
    };
  }

  private async runSingleTest(testCase: GoldenTestCase<TInput, TOutput>): Promise<EvalResult<TOutput>> {
    const testStartTime = Date.now();
    const errors: string[] = [];
    let score = 0;
    let actualOutput: TOutput;
    let evidence: any[] = [];
    let warnings: string[] = [];

    try {
      // Transform input if needed
      const input = this.config.transformInput
        ? this.config.transformInput(testCase.input)
        : testCase.input;

      // Create agent input
      const agentInput: AgentInput<TInput> = {
        payload: input,
        principal: this.config.principal,
        context: {},
        traceId: `eval-${testCase.id}`,
        spanId: `span-${Date.now()}`,
      };

      // Execute agent
      const result = await this.config.agentAdapter.execute(input, this.config.principal);
      actualOutput = result.data;
      evidence = result.evidence;
      warnings = result.warnings;

      // Compare output
      if (this.config.compareOutput) {
        const comparison = this.config.compareOutput(actualOutput, testCase.expectedOutput);
        score = comparison.score;
        errors.push(...comparison.errors);
      } else {
        // Default comparison: exact match for objects, similarity for strings
        score = this.defaultCompare(actualOutput, testCase.expectedOutput);
        if (score < 1) {
          errors.push(`Output mismatch: expected ${JSON.stringify(testCase.expectedOutput)}, got ${JSON.stringify(actualOutput)}`);
        }
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      actualOutput = null as any;
    }

    const passed = score >= this.config.threshold && errors.length === 0;

    return {
      testCaseId: testCase.id,
      passed,
      actualOutput,
      expectedOutput: testCase.expectedOutput,
      score,
      evidence,
      warnings,
      durationMs: Date.now() - testStartTime,
      errors,
    };
  }

  private defaultCompare(actual: any, expected: any): number {
    if (actual === expected) return 1;
    if (typeof actual === 'string' && typeof expected === 'string') {
      // Simple string similarity (Levenshtein would be better)
      const longer = actual.length > expected.length ? actual : expected;
      const shorter = actual.length > expected.length ? expected : actual;
      if (longer.length === 0) return 1;
      const editDistance = this.levenshtein(longer, shorter);
      return (longer.length - editDistance) / longer.length;
    }
    if (typeof actual === 'object' && typeof expected === 'object') {
      const actualKeys = Object.keys(actual);
      const expectedKeys = Object.keys(expected);
      const allKeys = new Set([...actualKeys, ...expectedKeys]);
      let matches = 0;
      for (const key of allKeys) {
        if (actual[key] === expected[key]) matches++;
        else if (typeof actual[key] === 'object' && typeof expected[key] === 'object') {
          matches += this.defaultCompare(actual[key], expected[key]);
        }
      }
      return matches / allKeys.size;
    }
    return 0;
  }

  private levenshtein(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    return matrix[b.length][a.length];
  }
}

// Convenience function for quick eval runs
export async function runEval<TInput, TOutput>(
  adapter: AgentAdapter<TInput, TOutput>,
  principal: Principal,
  testCases: GoldenTestCase<TInput, TOutput>[],
  options?: Partial<EvalConfig<TInput, TOutput>>
): Promise<EvalSuiteResult> {
  const config: EvalConfig<TInput, TOutput> = {
    agentAdapter: adapter,
    principal: options?.principal as Principal,
    threshold: options?.threshold ?? 0.95,
    transformInput: options?.transformInput,
    compareOutput: options?.compareOutput,
  };
  const harness = new EvalHarness(config);
  harness.addTestCases(testCases);
  return harness.run();
}