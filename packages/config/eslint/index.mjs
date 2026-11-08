import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * The single ESLint config for the monorepo.
 * @param {{ rootDir: string, nextApps?: string[] }} options
 */
export function createConfig({ rootDir, nextApps = [] }) {
  const appFiles = nextApps.map((dir) => `${dir}/**/*.{ts,tsx}`);

  return tseslint.config(
    {
      ignores: [
        '**/node_modules/**',
        '**/.next/**',
        '**/.turbo/**',
        '**/dist/**',
        '**/coverage/**',
        '**/next-env.d.ts',
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        globals: globals.node,
        parserOptions: { projectService: true, tsconfigRootDir: rootDir },
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
          },
        ],
        // Use a logger with info, warn or error; plain console.log is for debugging only.
        'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      },
    },
    {
      files: ['**/*.{js,mjs,cjs}'],
      ...tseslint.configs.disableTypeChecked,
    },
    {
      files: appFiles,
      plugins: {
        '@next/next': nextPlugin,
        'jsx-a11y': jsxA11y,
        'react-hooks': reactHooks,
      },
      languageOptions: { globals: globals.browser },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs['core-web-vitals'].rules,
        ...jsxA11y.flatConfigs.recommended.rules,
        ...reactHooks.configs.recommended.rules,
        // Pages Router only; both apps use the App Router.
        '@next/next/no-html-link-for-pages': 'off',
      },
    },
  );
}
