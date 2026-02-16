import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Call = {
  id: number;
  created_at: string;
  transcript: { role: 'caller' | 'receptionist'; text: string }[];
  next_steps: string | null;
  caller_phone: string | null;
  caller_name: string | null;
  duration: number | null;
};
