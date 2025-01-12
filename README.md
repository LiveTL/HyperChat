# HyperChat - Improved YouTube Chat

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/standard/semistandard)
[![Contributors](https://img.shields.io/github/contributors/LiveTL/HyperChat)](https://github.com/LiveTL/HyperChat/contributors)
[![Issues](https://img.shields.io/github/issues/LiveTL/HyperChat)](https://github.com/LiveTL/HyperChat/issues)
![Total Lines](https://img.shields.io/tokei/lines/github/LiveTL/HyperChat)
![Size](https://img.shields.io/github/repo-size/LiveTL/HyperChat)
[![Commit Activity](https://img.shields.io/github/commit-activity/w/LiveTL/HyperChat)](https://github.com/LiveTL/HyperChat/commits/)
[![Discord](https://img.shields.io/discord/780938154437640232.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/uJrV3tmthg)


## Install

HyperChat is available in the Chrome and Firefox stores.

See https://livetl.app/hyperchat/install


## Building from Source

### Development

> Note: The repo expects a Linux or Unix-like environment. If you are on Windows, use WSL.

Clone the repository:

```bash
git clone https://github.com/LiveTL/HyperChat
```

Open the repository and npm install:

```bash
cd hyperchat
npm install # install dependencies
```

Build or serve the extension:

```bash
npm run dev:chrome # devserver for Chrome extension
npm run dev:firefox # devserver for Firefox extension

npm run start:chrome # devserver + open extension in Chrome
npm run start:firefox # devserver + open extension in Firefox

VERSION=X.Y.Z npm run build # production mode (Chrome & Firefox)
VERSION=X.Y.Z npm run build:chrome # production mode (Chrome)
VERSION=X.Y.Z npm run build:firefox # production mode (Firefox)
```

### Building for Production

Our build script is an automated GitHub action. To simulate the build, please follow the steps outlined in the [Latest Release Build](.github/workflows/build.yml) workflow file.

Clarifications:
- `${{ github.ref }}` should evaluate to `vX.Y.Z`, where `X.Y.Z` is the version number.

The built ZIP files can be found in the `build` directory.
