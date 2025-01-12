# HyperChat - Improved YouTube Chat

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/standard/semistandard)
[![Contributors](https://img.shields.io/github/contributors/LiveTL/HyperChat)](https://github.com/LiveTL/HyperChat/contributors)
[![Issues](https://img.shields.io/github/issues/LiveTL/HyperChat)](https://github.com/LiveTL/HyperChat/issues)
![Total Lines](https://img.shields.io/tokei/lines/github/LiveTL/HyperChat)
![Size](https://img.shields.io/github/repo-size/LiveTL/HyperChat)
[![Commit Activity](https://img.shields.io/github/commit-activity/w/LiveTL/HyperChat)](https://github.com/LiveTL/HyperChat/commits/)
[![Discord](https://img.shields.io/discord/780938154437640232.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/uJrV3tmthg)

## Building from Source

### ⚠️ WARNING ⚠️

Due to unreliable Manifest v3 feature support in Firefox, we maintain both MV2 and MV3 versions of HyperChat in parallel. The MV2 variant sits in the `master` branch, while the MV3 variant sits on the `mv3` branch. When contributing, please ensure that you check out to the `master` branch to implement the features in MV2 first. Once the feature is stable, please open a separate PR to the `mv3` branch to port the feature to MV3.

### Development

> Note: The repo expects a Linux or Unix-like environment. If you are on Windows, use WSL.

Clone the repository:

```bash
git clone https://github.com/LiveTL/HyperChat
```

Open the repository and npm install:

```bash
cd hyperchat
git checkout master # switch to master for MV2 first!
npm install # install dependencies
```

Build or serve the extension:

```bash
npm run dev:chrome # devserver for Chrome extension
npm run dev:firefox # devserver for Firefox extension

npm run start:chrome # devserver + open extension in Chrome
npm run start:firefox # devserver + open extension in Firefox

VERSION=x.x.x npm run build # production mode (Chrome & Firefox)
VERSION=x.x.x npm run build:chrome # production mode (Chrome)
VERSION=x.x.x npm run build:firefox # production mode (Firefox)
```

## Building for Production

Our build script is an automated GitHub action. To simulate the build, please follow the steps outlined in the [Latest Release Build](.github/workflows/build.yml) workflow file.

Clarifications:
- `${{ github.ref }}` should evaluate to `vX.X.X`, where `X.X.X` is the version number.

The built ZIP files can be found in the `build` directory.
