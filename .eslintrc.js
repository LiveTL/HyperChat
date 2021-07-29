module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    webextensions: true
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'semistandard',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    sourceType: 'module'
  },
  rules: {
    'linebreak-style': [
      'error',
      'unix'
    ]
  },
  root: true
};
