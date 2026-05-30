/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TICKET_COUNT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
