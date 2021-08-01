/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { preprocess } = require('./svelte.config');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const mode = process.env.NODE_ENV || 'development';
const prod = mode !== 'development';

module.exports = {
  entry: {
    chat: path.join(__dirname, 'src', 'submodules', 'chat', 'scripts', 'chat.js'),
    'chat-interceptor': path.join(__dirname, 'src', 'submodules', 'chat', 'scripts', 'chat-interceptor.js'),
    'chat-background': path.join(__dirname, 'src', 'submodules', 'chat', 'scripts', 'chat-background.js'),
    'chat-injector': path.join(__dirname, 'src', 'submodules', 'chat', 'src', 'ts', 'chat-injector.ts')
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
      {
        test: /\.s?css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              // Prefer `dart-sass`
              implementation: require('sass'),
              sassOptions: {
                includePaths: ['./src/submodules/chat/src/theme', './node_modules']
              }
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/submodules/chat/assets',
          to: 'assets'
        },
        {
          from: 'src/manifest.json'
        }
      ]
    })
  ],
  mode,
  devServer: {
    host: 'http://localhost:3000/',
    disableHostCheck: true
  },
  devtool: prod ? false : 'eval-cheap-module-source-map'
};
