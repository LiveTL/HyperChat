/* eslint-disable @typescript-eslint/no-var-requires */
const config = require('smelte/tailwind.config.js');

const defaultConfig = config({});

module.exports = config({
  config: {
    theme: {
      colors: {
        ...defaultConfig.theme.colors,
        member: '#0E5D10',
        'member-dark': '#04B301',
        moderator: '#2441C0',
        'moderator-dark': '#A0BDFC',
        owner: '#866518',
        'owner-dark': '#FFD600',
        deleted: '#6E6B6B',
        'deleted-dark': '#898888'
      }
    }
  }
});
