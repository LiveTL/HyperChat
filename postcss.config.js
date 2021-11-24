const extractor = require('smelte/src/utils/css-extractor.js');
const tailwindConfig = require('./tailwind.config.js');

const safelistSelectors = [
  'html',
  'body',
  'stroke-primary',
  'mode-dark',
  // Components with custom color prop might need its color to be whitelisted too
  'bg-blue-500',
  'hover:bg-blue-400'
];

const safelistPatterns = [
  // for JS ripple
  /ripple/,
  // date picker
  /w-.\/7/,
  // I'm guessing it doesn't correlate p-2.5 with p-2\.5
  /^[mphw]\w?-\d\.5$/
];

module.exports = (minify = false) => {
  const postcss = [];
  return [
    require('postcss-import')(),
    require('postcss-url')(),
    require('postcss-input-range')(),
    require('autoprefixer')(),
    require('tailwindcss')(tailwindConfig),
    ...postcss,
    minify && require('cssnano')({
      preset: 'default'
    }),
    // Always tree shake CSS even in development mode for ~99% size reduction
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
