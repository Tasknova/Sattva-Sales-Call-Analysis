/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Exotel Configuration
  readonly VITE_EXOTEL_API_KEY: string
  readonly VITE_EXOTEL_API_TOKEN: string
  readonly VITE_EXOTEL_SUBDOMAIN: string
  readonly VITE_EXOTEL_ACCOUNT_SID: string
  
  // Supabase Configuration (if not already defined)
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}