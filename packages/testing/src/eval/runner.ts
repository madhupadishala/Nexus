import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { EvalHarness } from './harness.js';
import { createScreeningEvalConfig, compareScreeningOutput } from './screening-comparators.js';
import { testPrincipal } from '../fixtures/principals.js';
import { createScreeningAdapter } from '@nexus/agents';
import { ScreeningInput, ScreeningOutput } from '@nexus/adapters';

// Use __dirname from Node.js instead of import.meta.url
const repoRoot = join(__dirname, '../../../../');

async function runScreeningEval() {
  console.log('🧪 Starting Agent-4 Screening Evaluation...\n');

  const goldenPath = join(repoRoot, 'evals/golden/agent-4-screening.json');
  const goldenData = JSON.parse(readFileSync(goldenPath, 'utf-8'));
  const testCases = goldenData.testCases;

  console.log(`📋 Loaded ${testCases.length} test cases\n`);

  const adapter = createScreeningAdapter();

  // Use heuristic mode (no LLM gateway)
  const isHeuristic = true;
  const evalConfig = createScreeningEvalConfig(testPrincipal, isHeuristic);
  evalConfig.agentAdapter = adapter;
  evalConfig.compareOutput = (actual: ScreeningOutput, expected: ScreeningOutput) => compareScreeningOutput(actual, expected, isHeuristic);

  const harness = new EvalHarness<ScreeningInput, ScreeningOutput>(evalConfig);
  harness.addTestCases(testCases);

  const result = await harness.run();

  console.log('='.repeat(60));
  console.log(`EVALUATION RESULT: ${result.suiteName}`);
  console.log('='.repeat(60));
  console.log(`Total Cases: ${result.totalCases}`);
  console.log(`Passed: ${result.passed}`);
  console.log(`Failed: ${result.failed}`);
  console.log(`Pass Rate: ${(result.passRate * 100).toFixed(1)}%`);
  console.log(`Avg Score: ${(result.avgScore * 100).toFixed(1)}%`);
  console.log(`Duration: ${result.durationMs}ms`);
  console.log('='.repeat(60));

  for (const r of result.results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status} ${r.testCaseId} (score: ${(r.score * 100).toFixed(1)}%)`);
    if (r.errors.length > 0) {
      for (const err of r.errors) {
        console.log(`   ⚠️  ${err}`);
      }
    }
    if (r.warnings.length > 0) {
      for (const warn of r.warnings) {
        console.log(`   ℹ️  ${warn}`);
      }
    }
  }

  process.exit(result.failed > 0 ? 1 : 0);
}

runScreeningEval().catch(console.error);