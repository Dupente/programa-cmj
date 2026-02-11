
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dmlljmbbsstecdolfaqg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kzFvKbTRbdQF-Sj7V71I1w_otAKaAeM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
