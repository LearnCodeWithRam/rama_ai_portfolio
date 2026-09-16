import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createMistral } from '@ai-sdk/mistral';
import { streamText, type LanguageModel, type StreamTextResult } from 'ai';

import { SYSTEM_PROMPT } from './prompt';
import { logProviderError, SAFE_CHAT_ERROR, shouldUseFallback } from './provider-fallback';
import { getContact } from './tools/getContact';
import { getInternship } from './tools/getIntership';
import { getPresentation } from './tools/getPresentation';
import { getProjects } from './tools/getProjects';
import { getResume } from './tools/getResume';
import { getSkills } from './tools/getSkills';

export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash';
const MISTRAL_MODEL = process.env.MISTRAL_MODEL ?? 'mistral-small-latest';
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'openai/gpt-oss-20b';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_MODEL = process.env.CLOUDFLARE_MODEL ?? '@cf/google/gemma-4-26b-a4b-it';

const gemini = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
});
const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const cloudflare = createOpenAICompatible({
  name: 'cloudflare-workers-ai',
  baseURL: CLOUDFLARE_ACCOUNT_ID
    ? `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1`
    : '',
  apiKey: CLOUDFLARE_API_TOKEN,
});

const tools = {
  getProjects,
  getPresentation,
  getResume,
  getContact,
  getSkills,
  getInternship,
};

function startChat(model: LanguageModel, messages: Parameters<typeof streamText>[0]['messages']) {
  return streamText({
    model,
    messages,
    tools,
    maxSteps: 2,
    maxRetries: 0,
  });
}

const providers = [
  { name: 'cloudflare', model: CLOUDFLARE_MODEL, enabled: Boolean(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN), create: () => cloudflare(CLOUDFLARE_MODEL) },
  { name: 'gemini', model: GEMINI_MODEL, enabled: Boolean(GEMINI_API_KEY), create: () => gemini(GEMINI_MODEL) },
  { name: 'mistral', model: MISTRAL_MODEL, enabled: Boolean(process.env.MISTRAL_API_KEY), create: () => mistral(MISTRAL_MODEL) },
  { name: 'groq', model: GROQ_MODEL, enabled: Boolean(process.env.GROQ_API_KEY), create: () => groq(GROQ_MODEL) },
];

function continueFromPeekedChunk(
  result: StreamTextResult<typeof tools, never>,
  reader: ReadableStreamDefaultReader<unknown>,
  first: ReadableStreamReadResult<unknown>,
): StreamTextResult<typeof tools, never> {
  const reconstructed = new ReadableStream({
    async start(controller) {
      if (!first.done && first.value !== undefined) controller.enqueue(first.value);
    },
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  Object.defineProperty(result, 'fullStream', {
    get: () => reconstructed,
    configurable: true,
  });
  return result;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    messages.unshift(SYSTEM_PROMPT);

    const configuredProviders = providers.filter(provider => provider.enabled);
    if (configuredProviders.length === 0) {
      return new Response('Missing GEMINI_API_KEY, MISTRAL_API_KEY, and GROQ_API_KEY', { status: 500 });
    }

    for (const provider of configuredProviders) {
      const result = startChat(provider.create(), messages);
      const reader = result.fullStream.getReader();
      let firstChunk: ReadableStreamReadResult<unknown>;

      try {
        firstChunk = await reader.read();
      } catch (error) {
        logProviderError(provider.name, provider.model, error);
        await reader.cancel().catch(() => undefined);
        if (!shouldUseFallback(error)) throw error;
        continue;
      }

      const providerError = !firstChunk.done && firstChunk.value != null &&
        typeof firstChunk.value === 'object' && 'type' in firstChunk.value &&
        firstChunk.value.type === 'error'
        ? (firstChunk.value as { type: 'error'; error: unknown }).error
        : undefined;

      if (providerError) {
        logProviderError(provider.name, provider.model, providerError);
        await reader.cancel();
        if (!shouldUseFallback(providerError)) throw providerError;
        continue;
      }

      return continueFromPeekedChunk(result, reader, firstChunk).toDataStreamResponse({
        getErrorMessage: () => SAFE_CHAT_ERROR,
      });
    }

    return new Response(SAFE_CHAT_ERROR, { status: 503 });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(SAFE_CHAT_ERROR, { status: 500 });
  }
}
