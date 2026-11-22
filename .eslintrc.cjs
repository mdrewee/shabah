module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: ['dist/'],
  rules: {
    'no-unreachable': 'error',
    'no-duplicate-case': 'error',
    'no-debugger': 'error',
  },
};
