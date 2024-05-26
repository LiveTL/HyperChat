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
    minify: process.env.MINIFY !== 'false' ? 'terser' : false
  },
  plugins: [
    browserExtension({
      manifest: () => {
        const newManifest = {
          ...manifest,
          version: (process.env.VERSION ?? '') || manifest.version
        };
        if ('browser_specific_settings' in newManifest && process.env.ADDON_ID) {
          newManifest.browser_specific_settings.gecko.id = process.env.ADDON_ID;
        }
        return newManifest;
      },
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
        src: 'build/manifest.json',
        dest: 'build/',
        transform: (content) => {
          const newManifest = JSON.parse(content.toString());
          if ('incognito' in newManifest) {
            delete newManifest.incognito;
          }
          if ('service_worker' in newManifest.background) {
            newManifest.background = {
              scripts: [newManifest.background.service_worker]
            };
          }
          return JSON.stringify(newManifest, null, 2);
        },
        rename: 'manifest.firefox.json'
      }]
    }),
    copy({
      hook: 'writeBundle',
      targets: [{
        src: 'src/stylesheets/*',
        dest: 'build/stylesheets'
      }]
    }),
  ]
});
