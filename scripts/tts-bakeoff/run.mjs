#!/usr/bin/env node
/**
 * Sanskrit TTS bake-off runner (docs/plans/guided-mode.md §4.5). Local only;
 * nothing here ships to users.
 *
 * For each test mantra (mantras.json) × each enabled variant (variants.mjs),
 * prepare the text (sanskrit-prep.mjs), synthesise one clip per recitation
 * line, and save it under scripts/tts-bakeoff/out/audio/<variant>/. Then write
 * out/manifest.json and the blind A/B page out/ab.html.
 *
 *   node scripts/tts-bakeoff/run.mjs                 # every variant whose key is set
 *   node scripts/tts-bakeoff/run.mjs --dry-run       # call nothing, print the plan
 *   node scripts/tts-bakeoff/run.mjs --only=sarvam   # one provider (comma list)
 *   node scripts/tts-bakeoff/run.mjs --variants=gemini-deva,sarvam-v4-kn
 *   node scripts/tts-bakeoff/run.mjs --mantras=gayatri
 *   node scripts/tts-bakeoff/run.mjs --show-text     # print every prepared line
 *   node scripts/tts-bakeoff/run.mjs --force         # re-synthesise cached clips
 *
 * Keys come from .env.local at the repo root (or the environment):
 * GEMINI_API_KEY, SARVAM_API_KEY, PARLER_URL (+ optional PARLER_TOKEN).
 * A provider without its key is skipped with a message. Clips already on disk
 * are reused, so runs can be split across days and keys without paying twice.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepare, toIast, toKannada, splitLines, NORMALIZER_VERSION } from './sanskrit-prep.mjs';
import { variants as allVariants, estimateCostUsd } from './variants.mjs';
import * as gemini from './providers/gemini.mjs';
import * as sarvam from './providers/sarvam.mjs';
import * as parler from './providers/parler.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const OUT = join(HERE, 'out');
const PROVIDERS = { gemini, sarvam, parler };

// ---------- args and env ----------

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) usage(`unknown argument ${a}`);
    return [m[1], m[2] ?? true];
  }),
);
const KNOWN = new Set(['dry-run', 'only', 'variants', 'mantras', 'show-text', 'force', 'help']);
for (const k of Object.keys(args)) if (!KNOWN.has(k)) usage(`unknown flag --${k}`);
if (args.help) usage();
const list = (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : null);

const env = { ...readEnvFile(join(REPO, '.env.local')), ...process.env };
const DRY = Boolean(args['dry-run']);

const mantras = JSON.parse(readFileSync(join(HERE, 'mantras.json'), 'utf8')).mantras;
const pickMantras = list(args.mantras);
const selMantras = pickMantras ? mantras.filter((m) => pickMantras.includes(m.id)) : mantras;
if (pickMantras) for (const id of pickMantras) if (!mantras.some((m) => m.id === id)) usage(`no mantra "${id}"`);

const vs = allVariants(env);
const pickVariants = list(args.variants);
const pickProviders = list(args.only);
if (pickVariants) for (const id of pickVariants) if (!vs.some((v) => v.id === id)) usage(`no variant "${id}"`);
if (pickProviders) for (const p of pickProviders) if (!PROVIDERS[p]) usage(`no provider "${p}"`);
const selVariants = vs.filter((v) =>
  pickVariants ? pickVariants.includes(v.id) : !v.optional && (!pickProviders || pickProviders.includes(v.provider)),
);

// ---------- run ----------

console.log(`Sanskrit TTS bake-off — ${selMantras.length} mantras × ${selVariants.length} variants${DRY ? ' (dry run)' : ''}`);
console.log(`Output: ${relative(process.cwd(), OUT) || '.'}\n`);

const missing = {};
for (const p of new Set(selVariants.map((v) => v.provider))) {
  const key = PROVIDERS[p].envKey;
  if (!env[key]) missing[p] = key;
}
for (const [p, key] of Object.entries(missing)) {
  console.log(`  skip ${p}: ${key} is not set in .env.local — its variants will only reuse clips already on disk.`);
}
if (Object.keys(missing).length) console.log('');

const clips = [];
let calls = 0;
let wouldCall = 0;
let spent = 0;
let wouldSpend = 0;
let failures = 0;

for (const v of selVariants) {
  const provider = PROVIDERS[v.provider];
  const live = !DRY && !missing[v.provider];
  let vLines = 0, vChars = 0, vCached = 0, vMade = 0, vFailed = 0, streak = 0;
  console.log(`▸ ${v.id}  (${v.provider} ${v.model}, voice ${v.voice}, ${v.script}${v.visargaEcho ? ', visarga echo' : ''}${v.homorganic ? ', homorganic anusvara' : ''})`);

  for (const m of selMantras) {
    const lines = prepare(m.text, { script: v.script, visargaEcho: v.visargaEcho, homorganic: v.homorganic });
    for (const [i, { deva, input }] of lines.entries()) {
      vLines++;
      vChars += input.length;
      const hash = sha(JSON.stringify([v.provider, v.model, v.voice, v.language, v.pace, v.style, NORMALIZER_VERSION, input])).slice(0, 10);
      const base = `${m.id}-${String(i + 1).padStart(2, '0')}-${hash}`;
      const dir = join(OUT, 'audio', v.id);
      const existing = ['wav', 'mp3', 'ogg'].map((e) => join(dir, `${base}.${e}`)).find((f) => existsSync(f));
      if (args['show-text']) console.log(`    ${m.id} ${i + 1}: ${input}`);

      const clip = { mantra: m.id, variant: v.id, line: i, deva, input, file: null, bytes: 0, duration_s: null, latency_ms: null, est_cost_usd: null };

      if (existing && !args.force) {
        const bytes = readFileSync(existing);
        Object.assign(clip, { file: rel(existing), bytes: bytes.length, duration_s: wavDuration(bytes), cached: true });
        vCached++;
        clips.push(clip);
        continue;
      }
      if (!live || streak >= 3) {
        wouldCall++;
        wouldSpend += estimateCostUsd(v, { chars: input.length });
        continue;
      }
      const t0 = Date.now();
      try {
        const out = await provider.synth({ input, variant: v, env });
        mkdirSync(dir, { recursive: true });
        const file = join(dir, `${base}.${out.ext}`);
        writeFileSync(file, out.bytes);
        const duration = out.ext === 'wav' ? wavDuration(out.bytes) : null;
        const cost = estimateCostUsd(v, { chars: input.length, durationS: duration ?? undefined });
        Object.assign(clip, { file: rel(file), bytes: out.bytes.length, duration_s: duration, latency_ms: Date.now() - t0, est_cost_usd: round(cost, 5), meta: out.meta });
        spent += cost;
        calls++;
        vMade++;
        streak = 0;
        process.stdout.write('.');
      } catch (e) {
        clip.error = String(e?.message ?? e);
        vFailed++;
        streak++;
        failures++;
        process.stdout.write('x');
      }
      clips.push(clip);
    }
  }
  if (vMade || vFailed) process.stdout.write('\n');
  const est = selMantras.reduce((s, m) => s + prepare(m.text, v).reduce((a, l) => a + estimateCostUsd(v, { chars: l.input.length }), 0), 0);
  const parts = [`${vLines} lines, ${vChars} chars`, `est. $${est.toFixed(3)}`];
  if (vCached) parts.push(`${vCached} cached`);
  if (vMade) parts.push(`${vMade} made`);
  if (vFailed) parts.push(`${vFailed} FAILED${streak >= 3 ? ' (stopped this variant after 3 failures in a row)' : ''}`);
  if (!live && vLines - vCached > 0) parts.push(`${vLines - vCached} would be synthesised`);
  console.log(`    ${parts.join(' · ')}`);
}

const firstErr = clips.find((c) => c.error);
if (firstErr) console.log(`\nFirst error (${firstErr.variant} / ${firstErr.mantra} line ${firstErr.line + 1}): ${firstErr.error}`);

console.log('');
if (calls) console.log(`Synthesised ${calls} clips, estimated $${spent.toFixed(3)}.`);
if (wouldCall) console.log(`${DRY ? 'Would synthesise' : 'Not synthesised (no key, or stopped after errors)'}: ${wouldCall} clips, estimated $${wouldSpend.toFixed(3)}.`);

// ---------- manifest and A/B page ----------

const ok = clips.filter((c) => c.file);
if (!ok.length) {
  console.log('\nNo audio on disk yet, so no manifest or A/B page was written.');
  console.log('Add GEMINI_API_KEY / SARVAM_API_KEY / PARLER_URL to .env.local and run again (see README.md).');
  process.exit(failures ? 1 : 0);
}

const manifest = {
  generated_at: new Date().toISOString(),
  normalizer_version: NORMALIZER_VERSION,
  variants: selVariants.map(({ id, provider, model, voice, language, pace, script, visargaEcho, homorganic, style, note }) => ({
    id, provider, model, voice, language, pace, script, visargaEcho: !!visargaEcho, homorganic: !!homorganic, style, note,
  })),
  mantras: selMantras.map((m) => ({
    id: m.id,
    label: m.label,
    kind: m.kind,
    tests: m.tests,
    source: m.source,
    text: m.text,
    lines: splitLines(m.text).map((deva) => ({ deva, kannada: toKannada(deva), iast: toIast(deva) })),
  })),
  clips,
};
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

const template = readFileSync(join(HERE, 'ab.html'), 'utf8');
const seed = Math.floor(Math.random() * 2 ** 31);
const page = template.replace(
  '/*__BAKEOFF_DATA__*/ null',
  JSON.stringify({ seed, manifest }).replace(/</g, '\\u003c'),
);
writeFileSync(join(OUT, 'ab.html'), page);
console.log(`\nWrote ${rel(join(OUT, 'manifest.json'))} (${ok.length} clips) and ${rel(join(OUT, 'ab.html'))}.`);
console.log('Open out/ab.html in a browser to rate (see README.md).');
process.exit(failures ? 1 : 0);

// ---------- helpers ----------

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^(['"])(.*)\1$/, '$2')];
      }),
  );
}

function sha(s) {
  return createHash('sha256').update(s).digest('hex');
}

function rel(p) {
  return relative(OUT, p).split('\\').join('/');
}

function round(n, d) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** Duration of a PCM WAV from its header, or null. */
function wavDuration(buf) {
  if (buf.length < 44 || buf.subarray(0, 4).toString('ascii') !== 'RIFF') return null;
  let off = 12, byteRate = 0;
  while (off + 8 <= buf.length) {
    const id = buf.subarray(off, off + 4).toString('ascii');
    let size = buf.readUInt32LE(off + 4);
    if (id === 'fmt ') byteRate = buf.readUInt32LE(off + 16);
    if (id === 'data') {
      // Streaming encoders write 0 or 0xFFFFFFFF; fall back to what is there.
      if (size === 0 || size === 0xffffffff || off + 8 + size > buf.length) size = buf.length - off - 8;
      return byteRate ? round(size / byteRate, 2) : null;
    }
    off += 8 + size + (size % 2);
  }
  return null;
}

function usage(err) {
  if (err) console.error(`error: ${err}\n`);
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').match(/\/\*\*([\s\S]*?)\*\//)[1].replace(/^ \* ?/gm, ''));
  process.exit(err ? 2 : 0);
}
