const webpack = require('webpack');
const config = require('../webpack.config');

const fs = require('fs');

webpack(
  config,
  err => {
    if (err) throw err;
    // replaceVersion();
    addChromeManifest();
  }
);

// eslint-disable-next-line no-unused-vars
function replaceVersion () {
  try {
    const versionArg = process.argv.filter(arg => arg.startsWith('--version'))[0];
    const version = versionArg.split('=')[1];
    const manifest = JSON.parse(fs.readFileSync('./build/manifest.json', {
      encoding: 'utf8', flag: 'r'
    }));
    const newManifest = JSON.stringify({ ...manifest, version });
    fs.writeFileSync('./build/manifest.json', newManifest, {
      encoding: 'utf8', flag: 'w+'
    });
  } catch (e) { }
}

function addChromeManifest () {
  const manifest = JSON.parse(fs.readFileSync('./build/manifest.json', {
    encoding: 'utf8', flag: 'r'
  }));

  const chromeManifest = JSON.stringify({
    ...manifest, incognito: 'split'
  });

  fs.writeFileSync('./build/manifest.chrome.json', chromeManifest, {
    encoding: 'utf8', flag: 'w+'
  });
}
