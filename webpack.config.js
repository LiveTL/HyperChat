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

const transformManifest = (manifestString, version, isChrome = false) => {
  const newManifest = {
    ...JSON.parse(manifestString),
    version
  };
  if (isChrome) newManifest.incognito = 'split';
  return JSON.stringify(newManifest);
};

module.exports = (env, options) => {
  const mode = options.mode;
  const prod = mode !== 'development';

  const envVersion = env.version;
  const hasEnvVersion = (envVersion != null && typeof envVersion === 'string');

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
      publicPath: './'
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
              hotReload: !prod,
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
    plugins: [
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'assets',
            to: 'assets'
          },
          {
            // Explicitly not an entry point so that the import it contains uses browser's dynamic import.
            from: 'src/hyperchat-frame.js',
            to: '.'
          },
          {
            from: 'src/manifest.json',
            transform(content) {
              return transformManifest(content, hasEnvVersion ? envVersion : version);
            }
          },
          {
            from: 'src/manifest.json',
            to: 'manifest.chrome.json',
            transform(content) {
              return transformManifest(content, hasEnvVersion ? envVersion : version, true);
            }
          }
        ]
      }),
      new MiniCssExtractPlugin({ filename: 'tailwind.css' }),
      new HtmlWebpackPlugin({
        template: path.join(__dirname, 'src', 'template.html'),
        filename: 'hyperchat.html',
        chunks: ['hyperchat'],
        chunksSortMode: 'manual',
        // The generated page will be included as an about:blank (or rather, about:srcdoc) to avoid
        // cross origin issues issues (so that e.g. Google Translate extension can access its contents).
        // Since this page includes extension stylesheets and scripts, a <base> tag is added, which URL
        // is substituted in at runtime with the actual chrome extension base URL.
        // While stylesheets can be included directly in the HTML just fine, our scripts require access to
        // chrome.runtime, so they're excluded from the HTML here, and indirectly added as content scripts
        // via manifest.json and hyperchat-frame.js.
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

  return config;
};
