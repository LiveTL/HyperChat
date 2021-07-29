module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    webextensions: true
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'semistandard',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    sourceType: 'module'
  },
  plugins: [
    'svelte3',
    '@typescript-eslint'
  ],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
      rules: {
        'import/first': 'off',
        'import/no-duplicates': 'off',
        'import/no-mutable-exports': 'off',
        'no-multiple-empty-lines': [
          'error',
          {
            max: 2
          }
        ]
      }
    }
  ],
  rules: {
    'linebreak-style': [
      'error',
      'unix'
    ]
  },
  root: true,
  settings: {
    'svelte3/typescript': () => require('typescript')
  }
};
