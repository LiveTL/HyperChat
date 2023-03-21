const { spawn } = require('child_process');

const cmds = [
  'mkdir -p dist',
  'cd build',
  'zip -9r ../dist/HyperChat-Chrome.zip .',
  'cp ../dist/HyperChat-Chrome.zip ../dist/HyperChat-Firefox.zip',
  'zip -d ../dist/HyperChat-Firefox.zip manifest.json',
  'printf "@ manifest.firefox.json\\n@=manifest.json\\n" | zipnote -w ../dist/HyperChat-Firefox.zip',
  'zip -d ../dist/HyperChat-Chrome.zip manifest.firefox.json'
];

spawn(
  'sh',
  [
    '-c',
    cmds.join(' && ')
  ]
);
