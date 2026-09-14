/**
 * Validated environment.
 *
 * The previous version did `process.env.NEXT_PUBLIC_SUPABASE_URL || ''`, which
 * built a Supabase client pointing at nothing. Every query then failed, the
 * route swallowed the error and fell back to the hardcoded catalogue, so the
 * app looked like it worked while never once reaching the database. That is why
 * 18 seeded steps rendered as 6.
 *
 * Fail loudly instead.
 */

const PLACEHOLDERS = [
  'your-supabase-project',
  'your-supabase-anon-key',
  'your-anon-key',
  'YOUR_',
];

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and fill in the ` +
        `values from your Supabase project settings, under API.`,
    );
  }
  if (PLACEHOLDERS.some((p) => value.includes(p))) {
    throw new Error(
      `${name} still holds the placeholder value "${value.slice(0, 32)}...". ` +
        `Replace it with the real value from Supabase, otherwise every query ` +
        `fails silently and the app renders stale local data.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
};
