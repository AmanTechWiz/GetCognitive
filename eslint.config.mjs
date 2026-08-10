import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Global ignores — MDX content files and generated/build artifacts never linted
  {
    ignores: [
      'content/**',          // All MDX/markdown source content
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

  // React + hooks rules
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
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
      // well-established patterns in this codebase (e.g. mount detection
      // via useEffect(() => setMounted(true), []))
      'react-hooks/set-state-in-effect': 'off',

      // @next/next rules require the Next.js ESLint plugin which is
      // only meaningful inside Next.js builds; skip here
      '@next/next/no-img-element': 'off',
    },
  },

  // Disable rules that conflict with Prettier (must come last)
  prettierConfig,
);
