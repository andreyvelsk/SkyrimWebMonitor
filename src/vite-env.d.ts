/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_CAPACITOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __USED_ICON_PATHS__: string[];
declare const __USED_ICON_DATA_URLS__: Record<string, string>;

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
