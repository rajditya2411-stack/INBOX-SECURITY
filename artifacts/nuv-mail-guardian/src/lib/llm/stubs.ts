import type { MailMessage } from '@/data/messages';
import type { SecurityAnalysis } from '@/lib/analyzer';
import type { LLMProvider, LLMProviderStatus, LLMAnalysisResult } from './types';

export class AbstractLLMAdapter implements LLMProvider {
  readonly id: string;
  readonly name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  async getStatus(apiKey?: string): Promise<LLMProviderStatus> {
    if (this.id === 'none') return 'NONE';
    if (!apiKey || !apiKey.trim()) return 'MISSING_API_KEY';
    return 'READY_FOR_INTEGRATION';
  }

  async analyze(message: MailMessage, analysis: SecurityAnalysis, apiKey?: string, model?: string): Promise<LLMAnalysisResult> {
    const status = await this.getStatus(apiKey);
    if (status === 'NONE') {
      return {
        available: false,
        providerId: this.id,
        error: 'AI Provider is set to None. Rule-based security engine remains fully active.',
      };
    }
    if (status === 'MISSING_API_KEY') {
      return {
        available: false,
        providerId: this.id,
        error: `API Key is missing for ${this.name}. Enter key in Settings. Rule-based security engine remains active.`,
      };
    }

    const selectedModel = model?.trim() ? model.trim() : 'default';
    return {
      available: true,
      providerId: this.id,
      riskLevel: analysis.riskLevel,
      confidence: 0.95,
      summary: `[${this.name} (${selectedModel}) - Contract Ready] Evaluated ${analysis.signals.length} deterministic signal(s) for "${message.subject}".`,
      reasons: analysis.signals.map((s) => `Engine signal: ${s}`),
      recommendedAction: analysis.recommendation,
    };
  }
}

export const OpenAIProvider = new AbstractLLMAdapter('openai', 'OpenAI');
export const AnthropicProvider = new AbstractLLMAdapter('anthropic', 'Anthropic / Claude');
export const GeminiProvider = new AbstractLLMAdapter('gemini', 'Google Gemini');
export const GrokProvider = new AbstractLLMAdapter('grok', 'xAI / Grok');
export const CompatibleProvider = new AbstractLLMAdapter('compatible', 'OpenAI-compatible');
export const NoneProvider = new AbstractLLMAdapter('none', 'None');

const llmRegistry: Record<string, LLMProvider> = {
  none: NoneProvider,
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  gemini: GeminiProvider,
  grok: GrokProvider,
  compatible: CompatibleProvider,
};

export function getLLMProvider(id: string): LLMProvider {
  return llmRegistry[id] ?? NoneProvider;
}
