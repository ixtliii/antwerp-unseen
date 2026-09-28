import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * The archive and artists pages run on mock data and don't use this client.
 * It is still used by the submit flow, installation and moderation, so it must
 * never throw at import time: createClient() throws on an empty URL, so we fall
 * back to a placeholder. Requests then simply fail instead of crashing the app.
 */
export const supabase = createClient(
    supabaseUrl || 'http://localhost:54321',
    supabaseAnonKey || 'missing-anon-key',
);
