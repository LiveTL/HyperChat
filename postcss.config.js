/* eslint-disable @typescript-eslint/no-var-requires */
const extractor = require('smelte/src/utils/css-extractor.js');

const safelistSelectors = [
  'html',
  'body',
  'stroke-primary',
  'mode-dark'
  // Components with custom color prop might need to its color to be whitelisted too
];

const safelistPatterns = [
  // for JS ripple
  /ripple/,
  // date picker
  /w-.\/7/,
  // I'm guessing it doesn't correlate p-2.5 with p-2\.5
  /^[mphw]\w?-\d\.5$/
];

module.exports = (purge = false, tailwind = {}) => {
  const postcss = [];
  const tailwindConfig = require('./tailwind.config.js')(tailwind);
  return [
    require('postcss-import')(),
    require('postcss-url')(),
    require('postcss-input-range')(),
    require('autoprefixer')(),
    require('tailwindcss')(tailwindConfig),
    ...postcss,
    purge &&
      require('cssnano')({
        preset: 'default'
      }),
    purge &&
      require('@fullhuman/postcss-purgecss')({
        content: ['./**/*.svelte'],
        extractors: [
          {
            extractor,
            extensions: ['svelte']
          }
        ],
        safelist: {
          standard: safelistSelectors,
          deep: safelistPatterns
        }
      })
  ].filter(Boolean);
};
