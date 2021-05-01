const { spawn } = require('child_process');
const fs = require('fs');

function replaceVersion() {
  try {
    const versionArg = process.argv.filter(arg => arg.startsWith('--version'))[0];
    const version = versionArg.split('=')[1];
    const manifest = JSON.parse(fs.readFileSync('./dist/manifest.json', {
      encoding: 'utf8', flag: 'r'
    }));
    const newManifest = JSON.stringify({...manifest, version});
    fs.writeFileSync('./dist/manifest.json', newManifest, {
      encoding: 'utf8', flag: 'w+'
    });
  }
  catch (e) { }
}


function addChromeManifest() {
  const manifest = JSON.parse(fs.readFileSync('./dist/manifest.json', {
    encoding: 'utf8', flag: 'r'
  }));
  
  const chromeManifest = JSON.stringify({
    ...manifest, incognito: 'split'
  });

  fs.writeFileSync('./dist/manifest.chrome.json', chromeManifest, {
    encoding: 'utf8', flag: 'w+'
  });
}

const cmds = [
  'rm -rf zips',
  'mkdir -p zips',
  'cd dist',
  'zip -9r ../zips/HyperChat-Firefox.zip .',
  'cp ../zips/HyperChat-Firefox.zip ../zips/HyperChat-Chrome.zip',
  'zip -d ../zips/HyperChat-Chrome.zip manifest.json',
  'printf "@ manifest.chrome.json\\n@=manifest.json\\n" | zipnote -w ../zips/HyperChat-Chrome.zip',
  'zip -d ../zips/HyperChat-Firefox.zip manifest.chrome.json'
];

replaceVersion();
addChromeManifest();

spawn(
  'sh',
  [
    '-c',
    cmds.join(' && ')
  ]
);
