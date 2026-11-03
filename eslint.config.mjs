import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/lib/**', '**/dist/**', 'apps/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
