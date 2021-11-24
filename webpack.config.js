const path = require('path');
const webpack = require('webpack');
const { preprocess } = require('./svelte.config');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssPlugins = require('./postcss.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { HtmlWebpackSkipAssetsPlugin } = require('html-webpack-skip-assets-plugin');
const ExtReloader = require('webpack-ext-reloader');
const { version } = require('./package.json');

const extReloader = new ExtReloader({
  manifest: path.join(__dirname, 'src', 'manifest.json'),
  entries: {
    contentScript: ['chat-interceptor', 'chat-injector', 'hyperchat'],
    background: 'chat-background'
  },
  reloadPage: true
});

const transformManifest = (manifestString, version, prod, isChrome = false) => {
  const newManifest = {
    ...JSON.parse(manifestString),
    version
  };
  if (isChrome) newManifest.incognito = 'split';
  return JSON.stringify(newManifest, null, prod ? 0 : 2);
};

const contentScriptFrameFilterPlugin = (include, condition) => {
  return new webpack.BannerPlugin({
    banner:
// Our extension content scripts are injected to any frame that matches URLs given in manifest,
// and if match_about_blank is true, also any child about:blank/about:srcdoc frames.
// This little snippet both enforces the scripts are run in an extension script namespace
// (namely that chrome.runtime exists) and allows further DOM-based filtering for a specific frame
// via given condition string.
// While the condition could go in the content script source itself, webpack produces a lot of
// boilerplate that all needs to be ran before the actual script code (and this condition) run,
// so this provides a way to check the condition early before all that boilerplate.
`
console.log('contentScriptFrameFilterPlugin("${include}", "${condition.replace(/["']/g, "\\$&")}"):',
  '\\nlocation:', location, '\\nframeElement:', frameElement);
if (!chrome.runtime)
  console.error('chrome.runtime not found - script needs to run as an extension content script');
else if (${condition})
`.trim(), // original code must be a single statement (e.g. an IIFE) for above else-if to work
    raw: true, // don't wrap above banner in comment
    include,
  });
};

module.exports = (env, options) => {
  const mode = options.mode;
  const prod = mode !== 'development';

  const envVersion = env.version;
  const hasEnvVersion = (envVersion != null && typeof envVersion === 'string');
  const watch = env.WEBPACK_WATCH;

  const cssConfig = {
    test: /\.(sa|sc|c)ss$/,
    use: [
      MiniCssExtractPlugin.loader,
      'css-loader',
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            extract: true,
            plugins: postcssPlugins(prod)
          }
        }
      }
    ]
  };

  const config = {
    entry: {
      'chat-interceptor': path.join(__dirname, 'src', 'ts', 'chat-interceptor.ts'),
      'chat-background': path.join(__dirname, 'src', 'ts', 'chat-background.ts'),
      'chat-injector': path.join(__dirname, 'src', 'ts', 'chat-injector.ts'),
      hyperchat: path.join(__dirname, 'src', 'hyperchat.ts')
    },
    output: {
      path: path.join(__dirname, 'build'),
      filename: '[name].bundle.js',
      publicPath: './',
      iife: true // should already be true - must be enabled for contentScriptFrameFilterPlugin to work
    },
    resolve: {
      alias: {
        svelte: path.resolve('node_modules', 'svelte')
      },
      extensions: ['.mjs', '.js', '.svelte', '.tsx', '.ts'],
      mainFields: ['svelte', 'browser', 'module', 'main']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.svelte$/,
          use: {
            loader: 'svelte-loader',
            options: {
              compilerOptions: {
                dev: !prod // Built-in HMR
              },
              emitCss: false,
              hotReload: !prod && watch,
              preprocess
            }
          }
        },
        {
          // required to prevent errors from Svelte on Webpack 5+
          test: /node_modules\/svelte\/.*\.mjs$/,
          resolve: {
            fullySpecified: false
          }
        },
        cssConfig
      ]
    },
    optimization: {
      concatenateModules: true // concatenate modules even in development mode for cleaner output
    },
    plugins: [
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'assets',
            to: 'assets'
          },
          {
            from: 'src/manifest.json',
            transform(content) {
              return transformManifest(content, hasEnvVersion ? envVersion : version, prod);
            }
          },
          {
            from: 'src/manifest.json',
            to: 'manifest.chrome.json',
            transform(content) {
              return transformManifest(content, hasEnvVersion ? envVersion : version, prod, true);
            }
          }
        ]
      }),
      new MiniCssExtractPlugin({ filename: 'tailwind.css' }),
      // Following is a workaround for:
      // a) The HyperChat frame needing to be about:blank/about:srcdoc to avoid cross origin issues so that
      //    e.g. Google Translate extension can access its contents.
      // b) hyperchat.bundle.js needing to be in extension's namespace for chrome.runtime access.
      //    If that frame's document simply uses a <script> element to import hyperchat.bundle.js,
      //    it would be in the page's namespace rather than the extension's content script namespace.
      // c) manifest.json's built-in matching functionality cannot match ONLY the about:blank/about:srcdoc
      //    frame we want without matching the parent https://www.youtube.com/live_chat* frame,
      //    hence the need for the frameElement check below.
      // d) While this check could go in hyperchat.ts itself, the following allows the check to run before
      //    all the boilerplate that webpack produces.
      contentScriptFrameFilterPlugin('hyperchat.bundle.js',
        "frameElement && frameElement.id === 'hyperchat'"),
      new HtmlWebpackPlugin({
        template: path.join(__dirname, 'src', 'template.html'),
        filename: 'hyperchat.html',
        chunks: ['hyperchat'],
        chunksSortMode: 'manual',
        // The generated page will be included as an about:blank (or rather, about:srcdoc) to avoid
        // cross origin issues issues (so that e.g. Google Translate extension can access its contents).
        // Since this page includes extension stylesheets and scripts, a <base> tag is added, which URL
        // is substituted in at runtime with the actual chrome extension base URL.
        // While stylesheets can be included directly in the HTML just fine, our scripts need to be
        // injected as extension content scripts (see above).
        base: '{HYPERCHAT_BASE_URL}',
        skipAssets: [asset => asset.tagName === 'script'],
      }),
      new HtmlWebpackSkipAssetsPlugin()
    ]
  };

  if (prod) {
    config.devtool = false;
  } else {
    config.devtool = 'eval-cheap-module-source-map';
    if (watch) {
      config.plugins.push(new webpack.HotModuleReplacementPlugin(), extReloader);
      // config.devServer = {
      //   host: 'localhost',
      //   port: 6000,
      //   hot: true,
      //   contentBase: path.join(__dirname, 'build'),
      //   headers: { 'Access-Control-Allow-Origin': '*' },
      //   writeToDisk: true,
      //   disableHostCheck: true
      // };
    }
  }

  return config;
};
