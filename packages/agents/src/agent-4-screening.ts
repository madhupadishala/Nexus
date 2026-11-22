import { Principal } from '@nexus/auth';
import { AgentAdapter, AdapterResult, Evidence, ScreeningInput, ScreeningOutput, validateScreeningInput } from '@nexus/adapters';
import { ModelGateway, CompletionRequest } from '@nexus/agent-runtime';

export function createScreeningAdapter(gateway?: ModelGateway): AgentAdapter<ScreeningInput, ScreeningOutput> {
  return {
    agentId: 'agent-4-screening',
    version: '1.0.0',

    validateInput(input: ScreeningInput) {
      return validateScreeningInput(input);
    },

    async execute(input: ScreeningInput, principal: Principal): Promise<AdapterResult<ScreeningOutput>> {
      const evidence: Evidence[] = [];
      const warnings: string[] = [];

      const prompt = buildScreeningPrompt(input);
      evidence.push({
        type: 'reasoning',
        source: 'agent-4-screening',
        content: `Screening article ${input.articleId} with strategy ${input.searchStrategyId}`,
        confidence: 1.0,
      });

      let result: ScreeningOutput;
      if (gateway) {
        const request: CompletionRequest = {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          maxTokens: 2000,
        };
        const response = await gateway.complete(request);
        result = parseScreeningResponse(response.content);
        evidence.push({
          type: 'tool',
          source: 'model-gateway',
          content: `Model response: ${response.content.slice(0, 500)}...`,
          confidence: 0.9,
          metadata: { model: response.model, tokens: response.usage },
        });
      } else {
        result = heuristicScreening(input);
        warnings.push('Using heuristic fallback — no model gateway configured');
      }

      if (result.confidence < 0.5) {
        warnings.push(`Low confidence: ${result.confidence}`);
      }

      return { data: result, evidence, warnings };
    },
  };
}

const SYSTEM_PROMPT = `You are a pharmacovigilance literature screening expert. 
Given an article title, abstract, and optional full text, determine if the article contains 
reportable Individual Case Safety Report (ICSR) information per ICH E2D and GVP Module VI.
Output ONLY valid JSON matching the ScreeningOutput schema.`;

function buildScreeningPrompt(input: ScreeningInput): string {
  return `Article ID: ${input.articleId}
Title: ${input.articleTitle}
Abstract: ${input.articleAbstract}
${input.articleFullText ? `Full Text: ${input.articleFullText.slice(0, 8000)}` : ''}

Screen for: Drugs, adverse events, patient demographics, exposure during pregnancy/lactation, 
occupational exposure, overdose, lack of efficacy, medication errors, counterfeit products.`;
}

function parseScreeningResponse(content: string): ScreeningOutput {
  try {
    const parsed = JSON.parse(content);
    if (!['INCLUDE', 'EXCLUDE', 'UNCERTAIN'].includes(parsed.decision)) {
      throw new Error('Invalid decision');
    }
    return parsed as ScreeningOutput;
  } catch {
    return {
      decision: 'UNCERTAIN',
      rationale: 'Failed to parse model output',
      extractedData: { drugs: [], events: [] },
      confidence: 0.1,
    };
  }
}

function heuristicScreening(input: ScreeningInput): ScreeningOutput {
  const text = `${input.articleTitle} ${input.articleAbstract}`.toLowerCase();
  const drugKeywords = ['drug', 'medication', 'treatment', 'therapy', 'dose'];
  const eventKeywords = ['adverse', 'event', 'reaction', 'side effect', 'toxicity'];
  
  const hasDrug = drugKeywords.some(k => text.includes(k));
  const hasEvent = eventKeywords.some(k => text.includes(k));
  
  return {
    decision: hasDrug && hasEvent ? 'INCLUDE' : 'EXCLUDE',
    rationale: `Heuristic: drug=${hasDrug}, event=${hasEvent}`,
    extractedData: { drugs: [], events: [] },
    confidence: 0.6,
  };
}
