import type { MailMessage } from '@/data/messages';
import type { SecurityAnalysis } from '@/lib/analyzer';

export type LLMProviderStatus = 'NONE' | 'NOT_CONFIGURED' | 'MISSING_API_KEY' | 'READY_FOR_INTEGRATION' | 'CONNECTED' | 'ERROR';

export type LLMAnalysisResult = {
  available: boolean;
  providerId: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence?: number; // 0-1
  summary?: string;
  reasons?: string[];
  recommendedAction?: string;
  error?: string;
};

export interface LLMProvider {
  id: string;
  name: string;

  getStatus(apiKey?: string): Promise<LLMProviderStatus>;

  analyze(message: MailMessage, analysis: SecurityAnalysis, apiKey?: string, model?: string): Promise<LLMAnalysisResult>;
}
