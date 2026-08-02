import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';
import importX from 'eslint-plugin-import-x';

// ============================================================
// Shared settings
// ============================================================
const commonGlobals = {
  ...globals.browser,
  ...globals.node,
  __USED_ICON_PATHS__: 'readonly',
  __USED_ICON_DATA_URLS__: 'readonly'
};

const importXSettings = {
  'import-x/resolver': {
    typescript: {
      alwaysTryTypes: true,
      project: './tsconfig.json'
    }
  },
  'import-x/extensions': ['.ts', '.tsx', '.js', '.jsx', '.vue'],
  'import-x/parsers': {
    '@typescript-eslint/parser': ['.ts', '.tsx']
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
// Import rules (without no-unresolved — tsc handles that)
// ============================================================
const importRules = {
  'import-x/no-cycle': 'warn',
  'import-x/no-self-import': 'error',
  'import-x/no-useless-path-segments': 'error',
  // Disabled: buggy with @/ aliases in eslint-import-resolver-typescript v4
  'import-x/no-unresolved': 'off',
  'import-x/extensions': 'off',
  // Disabled: false positives with CJS modules
  'import-x/default': 'off',
  'import-x/no-named-as-default': 'off',
  'import-x/no-named-as-default-member': 'off',
  'import-x/named': 'off',
  'import-x/namespace': 'off'
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
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: commonGlobals
    },
    settings: importXSettings
  },

  // Base configs (these set their own parsers for specific file types)
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,

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
  // Vue files — parser is set by pluginVue.configs['flat/recommended']
  // Only add parserOptions (TypeScript inside Vue) and rules
  // ============================================================
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue']
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      ...commonRules,
      ...tsStrictRules,
      ...importRules,

      // Vue-specific
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
  }
];
