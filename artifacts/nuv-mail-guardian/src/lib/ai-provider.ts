import type { MailMessage } from '@/data/messages';
import type { AIProvider } from '@/hooks/use-security-settings';
import type { SecurityAnalysis } from '@/lib/analyzer';

export type AIAnalysisResult = {
  available: boolean;
  risk?: string;
  summary?: string;
  reasons?: string[];
  recommendation?: string;
  error?: string;
};

export type AIProviderAdapter = {
  analyze: (message: MailMessage, analysis: SecurityAnalysis) => Promise<AIAnalysisResult>;
};

import { getLLMProvider } from '@/lib/llm/stubs';

export function createAIProvider(provider: AIProvider, apiKey: string, model: string): AIProviderAdapter | null {
  if (provider === 'none') return null;
  const llm = getLLMProvider(provider);
  return {
    async analyze(message: MailMessage, analysis: SecurityAnalysis) {
      const res = await llm.analyze(message, analysis, apiKey, model);
      return {
        available: res.available,
        risk: res.riskLevel,
        summary: res.summary,
        reasons: res.reasons,
        recommendation: res.recommendedAction,
        error: res.error,
      };
    },
  };
}