/**
 * Sarvam Bulbul through the REST text-to-speech endpoint.
 *
 * Verified 18 Oct 2026 on https://docs.sarvam.ai/api-reference-docs/text-to-speech/convert
 * and https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/voices:
 *   POST https://api.sarvam.ai/text-to-speech
 *   header api-subscription-key
 *   body {text, language_code, model, speaker, pace, speech_sample_rate,
 *         output_audio_codec, temperature, dict_id}
 *   model bulbul:v4-flash | bulbul:v3 (API default) | bulbul:v2 (legacy)
 *   v4-flash speakers are personas <name>_<lang>_<style>, e.g. mani_hi_devotional;
 *     kn-IN personas: chaitra_kn_conversation, chaitra_kn_narration,
 *     chetan_kn_conversation, suchitra_kn_narration
 *   v3 speakers are plain names (shubh, mani, anand, …), not language-tagged
 *   pace 0.5–2.0 (v3, v4-flash); text max 2500 chars; no SSML
 *   response {request_id, audios: [base64]}
 */

import { fetchWithRetry } from './http.mjs';

export const ENDPOINT = 'https://api.sarvam.ai/text-to-speech';

export const name = 'sarvam';
export const envKey = 'SARVAM_API_KEY';

/**
 * @param {{input: string, variant: any, env: Record<string,string|undefined>}} args
 */
export async function synth({ input, variant, env }) {
  if (input.length > 2500) throw new Error(`Sarvam: line is ${input.length} chars, max 2500`);
  const body = {
    text: input,
    language_code: variant.language,
    model: variant.model,
    speaker: variant.voice,
    pace: variant.pace,
    speech_sample_rate: 24000,
    output_audio_codec: 'wav',
  };
  if (variant.temperature != null) body.temperature = variant.temperature;
  if (env.SARVAM_DICT_ID) body.dict_id = env.SARVAM_DICT_ID;
  const res = await fetchWithRetry(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-subscription-key': env[envKey] ?? '' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  const b64 = json?.audios?.[0];
  if (typeof b64 !== 'string') throw new Error(`Sarvam: no audio in response: ${JSON.stringify(json).slice(0, 400)}`);
  return {
    bytes: Buffer.from(b64, 'base64'),
    ext: 'wav',
    mime: 'audio/wav',
    meta: { request_id: json.request_id ?? null },
  };
}
