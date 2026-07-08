import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase config. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    'to a .env file locally, and to your Vercel project\'s Environment Variables when deployed.'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
