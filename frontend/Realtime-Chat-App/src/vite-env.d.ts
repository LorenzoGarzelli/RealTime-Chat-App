/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MESSAGE_TTL: number;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
