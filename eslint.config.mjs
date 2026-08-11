import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Global ignores — MDX content files and generated/build artifacts never linted
  {
    ignores: [
      'content/**', // All MDX/markdown source content
      '.next/**',
      'out/**',
      'node_modules/**',
      '*.mdx',
      '*.md',
      'scaffold.mjs',
      'scripts/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript rules for all TS/TSX source files
  ...tseslint.configs.recommended,

  // Node.js globals for config files (.mjs, next.config.mjs, vitest.config.ts, etc.)
  {
    files: ['*.mjs', '*.cjs', 'vitest.config.ts', 'playwright.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Test files — add browser + vitest globals, relax some rules
  {
    files: ['tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // React + hooks rules for app source files
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // React 17+ JSX transform — no need to import React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // TypeScript tightening
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // General quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',

      // Disable overly strict rules that produce false positives on
      // well-established patterns (e.g. mount detection via useEffect(() => setMounted(true), []))
      'react-hooks/set-state-in-effect': 'off',

      // @next/next rules require the Next.js ESLint plugin loaded inside a Next.js build
      '@next/next/no-img-element': 'off',
    },
  },

  // Disable rules that conflict with Prettier (must come last)
  prettierConfig,
);
