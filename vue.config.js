const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background.js'
        },
        contentScripts: {
          entries: {
            chat: [
              'src/submodules/chat/scripts/chat.js'
            ]
          }
        }
      }
    }
  },
  transpileDependencies: [
    'vuetify'
  ],
  publicPath: '',
  productionSourceMap: false,
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin([{
        from: 'src/submodules/chat/assets',
        to: 'assets'
      }])
    ]
  }
};
