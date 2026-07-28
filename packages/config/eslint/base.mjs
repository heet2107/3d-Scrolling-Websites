import tseslint from 'typescript-eslint'

/**
 * Flat ESLint config shared by all non-Next.js workspace packages.
 * The Next.js app extends eslint-config-next instead.
 */
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
)
