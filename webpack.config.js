const path = require('path');
const mode = process.env.NODE_ENV || 'development';
const prod = mode !== 'development';
const { preprocess } = require('./svelte.config');

module.exports = {
  entry: {
    chat: path.join(__dirname, 'src', 'submodules', 'chat', 'scripts', 'chat.js'),
    'chat-interceptor': path.join(__dirname, 'src', 'submodules', 'chat', 'scripts', 'chat-interceptor.js'),
    'chat-background': path.join(__dirname, 'src', 'submodules', 'chat', 'scripts', 'chat-background.js')
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].bundle.js',
    publicPath: './'
  },
  module: {
    rules: [
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
      }
    ]
  },
  mode,
  devServer: {
    host: 'http://localhost:3000/',
    disableHostCheck: true
  },
  devtool: prod ? false : 'eval-cheap-module-source-map'
};
