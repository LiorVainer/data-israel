import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tsEslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintConfigPrettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import promise from 'eslint-plugin-promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

// /** @type {import("eslint").FlatConfig[]} */
export default defineConfig([
    globalIgnores([
        // Default ignores of eslint-config-next:
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts',
        // Reference files not part of the application:
    ]),
    js.configs.recommended,
    ...tsEslint.configs.recommended,
    reactHooks.configs['recommended-latest'],
    reactRefresh.configs.recommended,
    // unicorn.configs.recommended,
    // sonarjs.configs.recommended,
    promise.configs['flat/recommended'],
    eslintConfigPrettier,
    prettierRecommended,
    {
        // extends: [importPlugin.flatConfigs.typescript],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: globals.browser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
                project: 'tsconfig.json',
            },
        },
        plugins: {
            react,
            'jsx-a11y': jsxA11y,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': 'off',
            'no-empty-pattern': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            'prettier/prettier': 'warn',
            'unicorn/prevent-abbreviations': 'off',
            'unicorn/filename-case': 'off',
            'unicorn/prefer-logical-operator-over-ternary': 'off',
            'unicorn/prefer-module': 'off',
            'unicorn/no-null': 'off',
            'sonarjs/no-unused-vars': 'off',
            'sonarjs/slow-regex': 'off',
            'sonarjs/prefer-read-only-props': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'sonarjs/no-dead-store': 'off',
            'sonarjs/void-use': 'off',
            'unicorn/no-abusive-eslint-disable': 'off',
            'unicorn/prefer-string-raw': 'off',
            'unicorn/no-array-for-each': 'off',
            'unicorn/import-style': 'off',
            'unicorn/consistent-function-scoping': 'off',
            'unicorn/prefer-global-this': 'off',
            '@typescript-eslint/ban-ts-comment': 'warn',
            'react/no-unescaped-entities': 'off',
            'promise/catch-or-return': 'warn',
            'promise/always-return': 'warn',
        },
        settings: {
            react: { version: 'detect' },
        },
    },
]);
