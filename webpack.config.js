const path = require('path');
const webpack = require('webpack');
const { preprocess } = require('./svelte.config');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssPlugins = require('./postcss.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtReloader = require('webpack-ext-reloader');
const { version } = require('./package.json');

const extReloader = new ExtReloader({
  manifest: path.join(__dirname, 'src', 'manifest.json'),
  entries: {
    contentScript: ['chat-interceptor', 'chat-injector'],
    background: 'chat-background',
    extensionPage: 'hyperchat'
  },
  reloadPage: true
});

const transformManifest = (manifestString, version, prod, isChrome = false) => {
  const newManifest = {
    ...JSON.parse(manifestString),
    version
  };
  if (isChrome) newManifest.incognito = 'split';
  if (!prod) newManifest.content_security_policy = 'script-src \'self\' \'unsafe-eval\'; object-src \'self\'';
  return JSON.stringify(newManifest, null, prod ? 0 : 2);
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
      hyperchat: path.join(__dirname, 'src', 'hyperchat.ts'),
      gtrans: path.join(__dirname, 'src', 'gtrans.ts')
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
      new HtmlWebpackPlugin({
        template: path.join(__dirname, 'src', 'template.html'),
        filename: 'hyperchat.html',
        chunks: ['hyperchat', 'gtrans'],
        chunksSortMode: 'manual'
      })
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
