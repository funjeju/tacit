import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// 편의용 — 런타임에서만 호출됨
export const anthropic = {
  get messages() {
    return getAnthropicClient().messages;
  },
};

export const MODELS = {
  sonnet: process.env.ANTHROPIC_MODEL_SONNET ?? 'claude-sonnet-4-6-20250514',
  haiku: process.env.ANTHROPIC_MODEL_HAIKU ?? 'claude-haiku-4-5-20251001',
} as const;
