module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    webextensions: true
  },
  extends: 'semistandard',
  parserOptions: {
    sourceType: 'module'
  },
  plugins: [
    'svelte3'
  ],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3'
    }
  ],
  rules: {
    'linebreak-style': [
      'error',
      'unix'
    ]
  },
  root: true
};
