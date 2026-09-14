import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

// env throws on missing or placeholder values, so a misconfigured deployment
// fails at startup instead of silently serving the hardcoded catalogue.
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
