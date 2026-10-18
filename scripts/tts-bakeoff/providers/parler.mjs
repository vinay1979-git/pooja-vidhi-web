/**
 * Generic HTTP adapter for a self-hosted AI4Bharat Indic Parler-TTS endpoint
 * (e.g. a Modal function or a Hugging Face Inference Endpoint you deploy).
 * There is no managed API, so this defines its own small contract:
 *
 *   POST $PARLER_URL
 *   Content-Type: application/json
 *   Authorization: Bearer $PARLER_TOKEN        (only if PARLER_TOKEN is set)
 *   {"text": "<Devanagari line>", "description": "<caption>"}
 *
 *   → either raw audio bytes (Content-Type audio/wav, audio/mpeg, …)
 *   → or JSON {"audio": "<base64>", "format": "wav"|"mp3"}
 *
 * In the model card's Python, this is model.generate(input_ids=description,
 * prompt_input_ids=text); the speaker is named inside the caption ("Aryan …").
 */

import { fetchWithRetry } from './http.mjs';

export const name = 'parler';
export const envKey = 'PARLER_URL';

/**
 * @param {{input: string, variant: any, env: Record<string,string|undefined>}} args
 */
export async function synth({ input, variant, env }) {
  const headers = { 'Content-Type': 'application/json' };
  if (env.PARLER_TOKEN) headers.Authorization = `Bearer ${env.PARLER_TOKEN}`;
  const res = await fetchWithRetry(env[envKey] ?? '', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: input, description: variant.style }),
  }, { label: 'parler' });
  const type = res.headers.get('content-type') ?? '';
  if (type.startsWith('audio/')) {
    const ext = type.includes('mpeg') ? 'mp3' : type.includes('ogg') ? 'ogg' : 'wav';
    return { bytes: Buffer.from(await res.arrayBuffer()), ext, mime: type.split(';')[0], meta: {} };
  }
  const json = await res.json();
  if (typeof json?.audio !== 'string') throw new Error(`Parler: expected audio bytes or {audio}, got ${JSON.stringify(json).slice(0, 300)}`);
  const ext = json.format === 'mp3' ? 'mp3' : 'wav';
  return { bytes: Buffer.from(json.audio, 'base64'), ext, mime: ext === 'mp3' ? 'audio/mpeg' : 'audio/wav', meta: {} };
}
