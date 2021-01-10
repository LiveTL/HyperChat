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
              'src/content-scripts/chat.js'
            ]
          }
        }
      }
    }
  },
  transpileDependencies: [
    'vuetify'
  ],
  publicPath: ''
};
