/**
 * Gemini native TTS through the Interactions REST API.
 *
 * Verified 18 Oct 2026 on https://ai.google.dev/gemini-api/docs/speech-generation:
 *   POST https://generativelanguage.googleapis.com/v1beta/interactions
 *   header x-goog-api-key
 *   model gemini-3.8-flash-tts (also gemini-3.8-flash-lite-tts)
 *   input[].content[] = {type:"text", text, annotations:[{type:"speech_metadata", style}]}
 *   response_format {type:"audio"} → unary default audio/wav, 24 kHz mono 16-bit
 *   generation_config.speech_config = [{voice}]
 *   audio at steps[type=model_output].content[type=audio].data (base64)
 * The text field is spoken verbatim; delivery direction goes in `style`.
 * Language is auto-detected; there is no language_code field.
 */

import { fetchWithRetry } from './http.mjs';

export const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

export const name = 'gemini';
export const envKey = 'GEMINI_API_KEY';

/**
 * @param {{input: string, variant: any, env: Record<string,string|undefined>}} args
 * @returns {Promise<{bytes: Buffer, ext: string, mime: string, meta: object}>}
 */
export async function synth({ input, variant, env }) {
  const body = {
    model: variant.model,
    input: [
      {
        type: 'user_input',
        content: [
          {
            type: 'text',
            text: input,
            annotations: [{ type: 'speech_metadata', style: variant.style }],
          },
        ],
      },
    ],
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice: variant.voice }] },
  };
  const res = await fetchWithRetry(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env[envKey] ?? '' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  const audio = findAudio(json);
  if (!audio) throw new Error(`Gemini: no audio in response: ${JSON.stringify(json).slice(0, 400)}`);
  const bytes = Buffer.from(audio.data, 'base64');
  const isWav = bytes.subarray(0, 4).toString('ascii') === 'RIFF';
  return {
    bytes: isWav ? bytes : pcmToWav(bytes, 24000),
    ext: 'wav',
    mime: 'audio/wav',
    meta: { usage: json.usage ?? json.usageMetadata ?? null },
  };
}

/** The last audio block of the last model_output step, searching defensively. */
function findAudio(json) {
  const steps = Array.isArray(json?.steps) ? json.steps.filter((s) => s?.type === 'model_output') : [];
  for (const step of steps.reverse()) {
    const blocks = (step.content ?? []).filter((c) => c?.type === 'audio' && typeof c.data === 'string');
    if (blocks.length) return blocks[blocks.length - 1];
  }
  // Fallback: any {data, mime_type: audio/*} anywhere in the response.
  let found = null;
  (function walk(o) {
    if (!o || typeof o !== 'object' || found) return;
    const mime = o.mime_type ?? o.mimeType;
    if (typeof o.data === 'string' && (o.type === 'audio' || /^audio\//.test(mime ?? ''))) found = o;
    else for (const v of Object.values(o)) walk(v);
  })(json);
  return found;
}

/** Wrap headerless 16-bit mono PCM in a WAV header. */
export function pcmToWav(pcm, sampleRate) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
