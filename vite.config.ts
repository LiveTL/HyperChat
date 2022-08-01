import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import browserExtension from 'vite-plugin-web-extension';
import path from 'path';
import copy from 'rollup-plugin-copy';
import manifest from './src/manifest.json';

export default defineConfig({
  root: 'src',
  build: {
    outDir: path.resolve(__dirname, 'build'),
    emptyOutDir: true,
    minify: process.env.MINIFY !== 'false'
  },
  plugins: [
    browserExtension({
      manifest: () => {
        const newManifest = {
          ...manifest,
          version: (process.env.VERSION ?? '') || manifest.version
        };
        return newManifest;
      },
      assets: 'assets',
      watchFilePaths: [
        path.resolve(__dirname, 'src/manifest.json')
      ],
      additionalInputs: [
        'hyperchat.html'
      ],
      disableAutoLaunch: process.env.BROWSER === 'none',
      browser: process.env.BROWSER === 'firefox' ? 'firefox' : 'chrome',
      webExtConfig: {
        startUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
        args: process.env.BROWSER === 'firefox' ? [''] : ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
      },
      verbose: true
    }),
    svelte({
      configFile: path.resolve(__dirname, 'svelte.config.js'),
      emitCss: false
    }),
    copy({
      hook: 'writeBundle',
      targets: [{
        src: 'build/manifest.json',
        dest: 'build/',
        transform: (content) => {
          const newManifest = JSON.parse(content.toString());
          newManifest.incognito = 'split';
          return JSON.stringify(newManifest, null, 2);
        },
        rename: 'manifest.chrome.json'
      }]
    })
  ]
});
