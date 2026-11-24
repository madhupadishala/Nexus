import { Principal } from '@nexus/auth';
import { AgentAdapter, AdapterResult, AgentInput, Evidence } from '@nexus/agent-runtime';

export interface GoldenTestCase<TInput = unknown, TOutput = unknown> {
  id: string;
  name: string;
  description: string;
  input: TInput;
  expectedOutput: TOutput;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface EvalResult<TOutput = unknown> {
  testCaseId: string;
  passed: boolean;
  actualOutput: TOutput;
  expectedOutput: TOutput;
  score: number; // 0-1 similarity score
  evidence: Evidence[];
  warnings: string[];
  durationMs: number;
  errors: string[];
}

export interface EvalSuiteResult {
  suiteName: string;
  totalCases: number;
  passed: number;
  failed: number;
  passRate: number;
  avgScore: number;
  results: EvalResult[];
  durationMs: number;
}

export interface EvalConfig<TInput = unknown, TOutput = unknown> {
  agentAdapter: AgentAdapter<TInput, TOutput>;
  principal: Principal;
  threshold: number; // minimum score to pass (default 0.95)
  transformInput?: (goldenInput: TInput) => TInput;
  compareOutput?: (actual: TOutput, expected: TOutput) => { score: number; errors: string[] };
}