/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AMPS_HOST: string
  readonly VITE_AMPS_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 