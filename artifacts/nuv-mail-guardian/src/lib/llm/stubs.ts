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

  async testConnection(apiKey?: string, model?: string): Promise<{ success: boolean; message: string }> {
    if (this.id === 'none') {
      return { success: false, message: 'Select an active provider (OpenAI, Gemini, Claude, or Grok).' };
    }
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: this.id,
          apiKey,
          model,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, message: `Server error (${res.status}): ${text}` };
      }

      return (await res.json()) as { success: boolean; message: string };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to connect to backend server. Make sure the API server is running on port 5000.',
      };
    }
  }

  async analyze(message: MailMessage, analysis: SecurityAnalysis, apiKey?: string, model?: string): Promise<LLMAnalysisResult> {
    if (this.id === 'none') {
      return {
        available: false,
        providerId: this.id,
        error: 'AI Provider is set to None. Rule-based security engine remains fully active.',
      };
    }

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: this.id,
          apiKey,
          model,
          message,
          analysis,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI proxy returned HTTP status ${res.status}`);
      }

      const data = (await res.json()) as LLMAnalysisResult;
      return data;
    } catch (err: any) {
      // Graceful fallback to local rule-based engine simulation
      const selectedModel = model?.trim() ? model.trim() : 'default';
      return {
        available: false,
        providerId: this.id,
        modelUsed: selectedModel,
        riskLevel: analysis.riskLevel,
        confidence: 0.9,
        summary: `[${this.name} (${selectedModel}) Fallback] Local Security Engine evaluated ${analysis.signals.length} signal(s) for "${message.subject}".`,
        reasons: analysis.signals.map((s) => `Engine signal: ${s}`),
        recommendedAction: analysis.recommendation,
        error: err?.message || 'Failed to connect to AI server proxy.',
      };
    }
  }
}

export const OpenAIProvider = new AbstractLLMAdapter('openai', 'OpenAI');
export const GeminiProvider = new AbstractLLMAdapter('gemini', 'Google Gemini');
export const AnthropicProvider = new AbstractLLMAdapter('anthropic', 'Anthropic / Claude');
export const GrokProvider = new AbstractLLMAdapter('grok', 'xAI / Grok');
export const NoneProvider = new AbstractLLMAdapter('none', 'None');

const llmRegistry: Record<string, LLMProvider> = {
  none: NoneProvider,
  openai: OpenAIProvider,
  gemini: GeminiProvider,
  anthropic: AnthropicProvider,
  grok: GrokProvider,
};

export function getLLMProvider(id: string): LLMProvider {
  return llmRegistry[id] ?? NoneProvider;
}

