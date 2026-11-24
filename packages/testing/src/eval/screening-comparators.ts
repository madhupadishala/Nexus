import { ScreeningInput, ScreeningOutput } from '@nexus/adapters';
import { EvalConfig } from './types.js';

export function createScreeningEvalConfig(principal: any, isHeuristic = false): EvalConfig<ScreeningInput, ScreeningOutput> {
  return {
    agentAdapter: null as any,
    principal,
    threshold: isHeuristic ? 0.3 : 0.95,
    transformInput: (input: ScreeningInput) => input,
    compareOutput: (actual: ScreeningOutput, expected: ScreeningOutput) => compareScreeningOutput(actual, expected, isHeuristic),
  };
}

export function compareScreeningOutput(
  actual: ScreeningOutput,
  expected: ScreeningOutput,
  isHeuristic = false
): { score: number; errors: string[] } {
  const errors: string[] = [];
  let score = 1;

  // DECISION MUST MATCH (critical)
  if (actual.decision !== expected.decision) {
    errors.push(`Decision mismatch: expected ${expected.decision}, got ${actual.decision}`);
    score = 0;
  }

  // Confidence - lenient
  const confidenceThreshold = isHeuristic ? 0.3 : 0.15;
  const confidenceDiff = Math.abs(actual.confidence - expected.confidence);
  if (confidenceDiff > confidenceThreshold) {
    errors.push(`Confidence diff too high: expected ${expected.confidence}, got ${actual.confidence} (diff: ${confidenceDiff})`);
    score *= isHeuristic ? 0.8 : 0.5;
  }

  // Rationale - very lenient for heuristic, just check keyword overlap with fuzzy matching
  if (isHeuristic) {
    const rationaleScore = keywordOverlapFuzzy(actual.rationale, expected.rationale);
    if (rationaleScore < 0.1) {
      errors.push(`Rationale has no keyword overlap with expected`);
      score *= 0.5;
    }
  } else {
    const rationaleScore = stringSimilarity(actual.rationale, expected.rationale);
    if (rationaleScore < 0.7) {
      errors.push(`Rationale dissimilar: expected "${expected.rationale}", got "${actual.rationale}" (score: ${rationaleScore})`);
      score *= rationaleScore;
    }
  }

  // Drugs extraction - check if at least one expected drug found
  const drugsScore = compareExtractedItems(
    actual.extractedData.drugs,
    expected.extractedData.drugs,
    'name'
  );
  const drugsThreshold = isHeuristic ? 0.2 : 0.8;
  if (drugsScore < drugsThreshold) {
    errors.push(`Drugs extraction mismatch (score: ${drugsScore})`);
    score *= isHeuristic ? 0.7 : drugsScore;
  }

  // Events extraction
  const eventsScore = compareExtractedItems(
    actual.extractedData.events,
    expected.extractedData.events,
    'term'
  );
  const eventsThreshold = isHeuristic ? 0.2 : 0.8;
  if (eventsScore < eventsThreshold) {
    errors.push(`Events extraction mismatch (score: ${eventsScore})`);
    score *= isHeuristic ? 0.7 : eventsScore;
  }

  return { score: Math.max(0, score), errors };
}

function compareExtractedItems<T extends { name?: string; term?: string }>(
  actual: T[],
  expected: T[],
  key: 'name' | 'term'
): number {
  if (expected.length === 0 && actual.length === 0) return 1;
  if (expected.length === 0) return 0.5;
  if (actual.length === 0) return 0;

  const expectedValues = expected.map(e => e[key]?.toLowerCase()).filter((v): v is string => Boolean(v));
  const actualValues = actual.map(a => a[key]?.toLowerCase()).filter((v): v is string => Boolean(v));

  let matches = 0;
  for (const ev of expectedValues) {
    if (actualValues.some(av => av === ev || av?.includes(ev) || ev?.includes(av))) {
      matches++;
    }
  }

  return matches / expectedValues.length;
}

function keywordOverlapFuzzy(a: string, b: string): number {
  // Normalize: lowercase, split into words, filter short words
  const aWords = a.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const bWords = b.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  // Stem words by removing common suffixes
  const stem = (w: string) => w.replace(/(ing|ed|s|es|er|est|ly)$/, '');

  const aStems = new Set(aWords.map(stem));
  const bStems = new Set(bWords.map(stem));

  const intersection = new Set([...aStems].filter(w => bStems.has(w)));
  const union = new Set([...aStems, ...bStems]);

  return intersection.size / union.size;
}

function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const aWords = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const bWords = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const intersection = new Set([...aWords].filter(w => bWords.has(w)));
  const union = new Set([...aWords, ...bWords]);
  return intersection.size / union.size;
}