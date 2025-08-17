import { createClient } from '@supabase/supabase-js'

// Safe environment variable access
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // Check if process exists and has env
    if (typeof process !== 'undefined' && process && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (error) {
    // If process is not defined, fall back to default
  }
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://vnsvgrphapsicombzmrn.supabase.co')
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3ZncnBoYXBzaWNvbWJ6bXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODgyNDMsImV4cCI6MjA3MDk2NDI0M30.v6Pw_GCOh3bDM_ME22Cqv9jcGl2BacM2aJXRuuJ76EA')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error)
  } else {
    console.log('✅ Supabase connected successfully!')
  }
})

export interface UserProfile {
  id: string
  username: string
  created_at: string
  last_login: string
}

export interface GameSave {
  id: string
  user_id: string
  save_data: any
  created_at: string
  updated_at: string
}
