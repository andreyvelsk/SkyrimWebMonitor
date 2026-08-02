import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import vueEslintParser from 'vue-eslint-parser';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';
import importX from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

// ============================================================
// Shared settings
// ============================================================
const commonGlobals = {
  ...globals.browser,
  ...globals.node,
  __USED_ICON_PATHS__: 'readonly',
  __USED_ICON_DATA_URLS__: 'readonly'
};

// ============================================================
// Custom resolver for @/ alias
// eslint-import-resolver-typescript v4 does not resolve tsconfig
// `paths` (e.g. `@/*` → `./src/*`), so we handle it ourselves.
// ============================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_ROOT = path.resolve(__dirname, 'src');

/**
 * Try to resolve a path with each extension in `extensions`.
 * Returns the absolute path if found, otherwise null.
 */
function tryExtensions(basePath, extensions) {
  // Direct file match
  if (fs.existsSync(basePath)) {
    const stat = fs.statSync(basePath);
    if (stat.isFile()) return basePath;
    // It's a directory — try index files
    for (const ext of extensions) {
      const indexPath = path.join(basePath, `index${ext}`);
      if (fs.existsSync(indexPath)) return indexPath;
    }
    return null;
  }
  // Try appending extensions
  for (const ext of extensions) {
    const withExt = `${basePath}${ext}`;
    if (fs.existsSync(withExt)) return withExt;
  }
  return null;
}

function createAliasResolver() {
  return {
    name: 'skyrim-alias-resolver',
    interfaceVersion: 3,
    resolve(modulePath, _sourceFile) {
      if (!modulePath.startsWith('@/')) {
        return { found: false };
      }
      const relativePath = modulePath.slice(2); // remove '@/'
      const basePath = path.join(SRC_ROOT, relativePath);
      const resolved = tryExtensions(basePath, ['.ts', '.tsx', '.vue', '.js', '/index.ts', '/index.vue', '/index.js']);
      if (resolved) {
        return { found: true, path: resolved };
      }
      return { found: false };
    }
  };
}

const importXSettings = {
  // Chain: custom @/ resolver first, then TypeScript resolver for everything else.
  // eslint-import-resolver-typescript v4 is incompatible with the legacy resolver
  // path (it lacks `resolveImport`), so we use resolver-next (interfaceVersion 3).
  'import-x/resolver-next': [
    createAliasResolver(),
    createTypeScriptImportResolver({
      alwaysTryTypes: true,
      project: './tsconfig.json'
    })
  ],
  'import-x/extensions': ['.ts', '.tsx', '.cts', '.mts', '.js', '.jsx', '.cjs', '.mjs', '.vue'],
  'import-x/external-module-folders': ['node_modules', 'node_modules/@types'],
  'import-x/parsers': {
    '@typescript-eslint/parser': ['.ts', '.tsx', '.cts', '.mts']
  }
};

// ============================================================
// Common rules for all files
// ============================================================
const commonRules = {
  'semi': ['error', 'always'],
  'eqeqeq': ['error', 'always'],
  'no-eval': 'error',
  'no-console': ['error', { allow: ['warn', 'error'] }],
  'no-debugger': 'error',
  'no-alert': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-arrow-callback': 'warn'
};

// ============================================================
// TypeScript strict rules (non-type-aware)
// ============================================================
const tsStrictRules = {
  // Ban `any`
  '@typescript-eslint/no-explicit-any': 'error',

  // Ban `as` type assertions (except `as const`)
  '@typescript-eslint/consistent-type-assertions': [
    'error',
    { assertionStyle: 'never' }
  ],

  // Ban non-null assertion (`!`)
  '@typescript-eslint/no-non-null-assertion': 'error',

  // Ban `@ts-ignore` and `@ts-nocheck`
  '@typescript-eslint/ban-ts-comment': [
    'error',
    {
      'ts-expect-error': false,
      'ts-ignore': true,
      'ts-nocheck': true,
      'ts-check': false
    }
  ],

  // Unused vars
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
  ],
  'no-unused-vars': 'off',

  // Other strict rules
  '@typescript-eslint/prefer-as-const': 'error',
  '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'separate-type-imports' }
  ],
  '@typescript-eslint/no-import-type-side-effects': 'error'
};

// ============================================================
// Type-aware rules (require projectService)
// ============================================================
const tsTypeAwareRules = {
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/no-unsafe-argument': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error'
};

// ============================================================
// Import rules
// ============================================================
const importRules = {
  // import-x/no-cycle is disabled because it recursively parses imported .vue
  // files via vue-eslint-parser which causes "parseForESLint is invalid" errors
  // when multiple files are linted simultaneously. Circular dependency detection
  // is covered by TypeScript compiler (tsc --noEmit).
  'import-x/no-cycle': 'off',
  'import-x/no-self-import': 'error',
  'import-x/no-useless-path-segments': 'error',
  'import-x/no-unresolved': 'error',
  'import-x/extensions': 'off',
  // Disabled: false positives with CJS modules
  'import-x/default': 'off',
  'import-x/no-named-as-default': 'off',
  'import-x/no-named-as-default-member': 'off',
  'import-x/named': 'off',
  'import-x/namespace': 'off',
  // Disabled: triggers recursive .vue file parsing via vue-eslint-parser
  // which causes "parseForESLint is invalid" errors when linting multiple files.
  'import-x/export': 'off'
};

// ============================================================
// FSD layer restriction helpers
// ============================================================
function fsdRestrictions(layer) {
  const allLayers = ['shared', 'entities', 'features', 'pages', 'app'];
  const layerIndex = allLayers.indexOf(layer);
  if (layerIndex === -1) return [];

  const forbidden = allLayers.slice(layerIndex + 1);
  if (forbidden.length === 0) return [];

  return [
    'error',
    {
      patterns: forbidden.map(l => ({
        group: [`@/${l}/*`],
        message: `❌ FSD: слой «${layer}» не может импортировать из слоя «${l}».`
      }))
    }
  ];
}

// ============================================================
// EXPORT
// ============================================================
export default [
  // Global ignores
  {
    ignores: [
      'node_modules',
      'dist',
      'dist-ssr',
      'dist-electron',
      '.git',
      'android',
      'electron',
      'deploy',
      'scripts',
      'public',
      'build',
      'tmp',
      'capacitor.config.ts'
    ]
  },

  // ============================================================
  // Common settings for ALL files (MUST come before plugin configs
  // so that plugin parsers can override the default parser)
  // ============================================================
  {
    name: 'skyrim/global-ignore-patterns',
    ignores: [
      '**/*.scss',
      '**/*.css',
      '**/*.json',
      '**/*.md',
      '**/*.svg',
      '**/*.png',
      '**/*.jpg',
      '**/*.webp',
      '**/*.ico',
      '**/*.xml',
      '**/*.toml',
      '**/*.lock',
      '**/*.gradle',
      '**/*.properties',
      '**/*.keystore',
      '**/*.crt',
      '**/*.key',
      '**/*.pem'
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: commonGlobals
    }
  },

  // Base configs
  js.configs.recommended,
  importX.flatConfigs.recommended,
  // NOTE: importX.flatConfigs.typescript is NOT used because it overrides
  // 'import-x/resolver' with `{ typescript: true }` (no project), which
  // breaks @/ path alias resolution. All its settings are inlined in
  // importXSettings above instead.
  // NOTE: pluginVue.configs['flat/recommended'] is NOT spread here because
  // it sets its own parser for .vue files which conflicts with our explicit
  // vueEslintParser. Vue rules are applied manually in the .vue block below.

  // Apply import-x settings AFTER base configs so they take precedence
  {
    settings: importXSettings
  },

  // ============================================================
  // JavaScript files
  // ============================================================
  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    rules: {
      ...commonRules,
      ...importRules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },

  // ============================================================
  // TypeScript files — type-aware
  // ============================================================
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      ...commonRules,
      ...tsStrictRules,
      ...tsTypeAwareRules,
      ...importRules
    }
  },

  // ============================================================
  // Vue files
  // ============================================================
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parser: vueEslintParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        extraFileExtensions: ['.vue']
      }
    },
    plugins: {
      vue: pluginVue,
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      ...commonRules,
      ...tsStrictRules,
      ...importRules,

      // Vue base setup rules (comment-directive, jsx-uses-vars)
      ...pluginVue.configs['flat/essential'][1].rules,

      // Vue essential rules
      ...pluginVue.configs['flat/essential'][2].rules,

      // Vue strongly-recommended rules
      ...pluginVue.configs['flat/strongly-recommended'][2].rules,

      // Vue recommended rules
      ...pluginVue.configs['flat/recommended'][4].rules,

      // Vue-specific overrides
      'vue/comment-directive': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/component-name-in-template-casing': ['error', 'kebab-case'],
      'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
      'vue/no-v-html': 'error',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'error',
      'vue/prefer-import-from-vue': 'error',
      'vue/no-unused-refs': 'error'
    }
  },

  // ============================================================
  // FSD: shared layer — can only import from shared
  // ============================================================
  {
    files: ['src/shared/**/*.{ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': fsdRestrictions('shared')
    }
  },

  // ============================================================
  // FSD: entities layer — can import from entities, shared
  // ============================================================
  {
    files: ['src/entities/**/*.{ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': fsdRestrictions('entities')
    }
  },

  // ============================================================
  // FSD: features layer — can import from features, entities, shared
  // ============================================================
  {
    files: ['src/features/**/*.{ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': fsdRestrictions('features')
    }
  },

  // ============================================================
  // FSD: pages layer — can import from pages, features, entities, shared
  // ============================================================
  {
    files: ['src/pages/**/*.{ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': fsdRestrictions('pages')
    }
  },

  // ============================================================
  // Preview components — allow v-html (for HTML content rendering)
  // ============================================================
  {
    files: ['**/Preview.vue', '**/BasePreview.vue'],
    rules: {
      'vue/no-v-html': 'off'
    }
  },

];
