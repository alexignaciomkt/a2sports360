import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('A variável de ambiente NEXT_PUBLIC_SUPABASE_URL está ausente.');
}

if (!supabaseServiceKey) {
  throw new Error('A variável de ambiente SUPABASE_SERVICE_ROLE_KEY está ausente e é obrigatória para o adminClient.');
}

export const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
