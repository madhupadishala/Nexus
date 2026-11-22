import { Principal } from '@nexus/auth';
import { AgentAdapter, AdapterResult, ValidationResult, Evidence } from '@nexus/agent-runtime';

export interface ScreeningInput {
  articleId: string;
  articleTitle: string;
  articleAbstract: string;
  articleFullText?: string;
  searchStrategyId: string;
  workspaceId: string;
}

export interface ScreeningOutput {
  decision: 'INCLUDE' | 'EXCLUDE' | 'UNCERTAIN';
  rationale: string;
  extractedData: {
    drugs: Array<{ name: string; confidence: number }>;
    events: Array<{ term: string; meddraCode?: string; confidence: number }>;
    patientInfo?: { age?: number; gender?: string; weight?: number };
  };
  confidence: number;
}

export function validateScreeningInput(input: ScreeningInput): ValidationResult {
  const errors: string[] = [];
  if (!input.articleTitle?.trim()) errors.push('articleTitle is required');
  if (!input.articleAbstract?.trim()) errors.push('articleAbstract is required');
  if (!input.searchStrategyId) errors.push('searchStrategyId is required');
  if (!input.workspaceId) errors.push('workspaceId is required');
  return { valid: errors.length === 0, errors };
}
