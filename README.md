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

> Note: The repo expects a Linux or Unix-like environment. If you are on Windows, use WSL.

Clone the repository:

```bash
git clone https://github.com/LiveTL/HyperChat
```

Open the repository and npm install:

```bash
cd hyperchat
yarn # install dependencies
```

Build or serve the extension:

```bash
yarn dev:firefox # devserver for firefox extension
yarn dev:chrome # devserver for chrome extension
yarn start # alias to yarn dev:chrome for backwards compat
yarn start:none # alias to yarn dev:chrome for backwards compat
yarn start:firefox # devserver + open extension in firefox
yarn start:chrome # devserver + open extension in chrome
yarn build # production mode (chrome)
yarn build:chrome # production mode (chrome)
yarn build:firefox # production mode (firefox)
VERSION=x.x.x yarn build
```
