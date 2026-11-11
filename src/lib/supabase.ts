import { createClient } from '@supabase/supabase-js'

function readSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local .env file and in the Vercel project settings, then rebuild.',
    )
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid Supabase project URL.')
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
    throw new Error('VITE_SUPABASE_URL must use HTTPS, except for local development.')
  }

  // Supabase's standard project URL uses supabase.co. Catch the common .com
  // typo early instead of letting the app fail later with a network error.
  if (parsedUrl.hostname.endsWith('.supabase.com')) {
    throw new Error(
      'VITE_SUPABASE_URL appears to use .supabase.com. Copy the Project URL shown in Supabase Dashboard → Project Settings → API; standard project URLs end in .supabase.co.',
    )
  }

  return { url: parsedUrl.toString().replace(/\/$/, ''), key }
}

const { url: supabaseUrl, key: supabaseKey } = readSupabaseConfig()

// The browser uses only the public anon/publishable key. Authorization must be
// enforced by Supabase Row Level Security; never put a service-role key here.
export const supabase = createClient(supabaseUrl, supabaseKey)
