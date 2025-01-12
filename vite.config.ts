import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import copy from 'rollup-plugin-copy';
import { defineConfig } from 'vite';
import browserExtension from 'vite-plugin-web-extension';
import zipPack from 'vite-plugin-zip-pack';

import manifest from './src/manifest.json';

const buildDir = `build/${process.env.BROWSER}`;

export default defineConfig({
  root: 'src',
  build: {
    outDir: path.resolve(__dirname, buildDir),
    emptyOutDir: true,
    minify: process.env.MINIFY !== 'false' ? 'terser' : false
  },
  plugins: [
    browserExtension({
      manifest: () => ({
        ...manifest,
        version: process.env.VERSION ?? manifest.version,
      }),
      assets: 'assets',
      watchFilePaths: [
        path.resolve(__dirname, 'src/manifest.json')
      ],
      additionalInputs: [
        'hyperchat.html',
        'scripts/chat-interceptor.ts',
        'scripts/chat-metagetter.ts'
      ],
      disableAutoLaunch: process.env.HC_AUTOLAUNCH === undefined,
      browser: process.env.BROWSER === undefined ? 'chrome' : process.env.BROWSER,
      webExtConfig: {
        startUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
      }
    }),
    svelte({
      configFile: path.resolve(__dirname, 'svelte.config.js'),
      emitCss: false
    }),
    copy({
      hook: 'writeBundle',
      targets: [{
        src: 'src/stylesheets/*',
        dest: `${buildDir}/stylesheets`
      }]
    }),
    zipPack({
      inDir: buildDir,
      outDir: 'build',
      outFileName: `HyperChat-${process.env.BROWSER}.zip`
    }),
  ]
});
