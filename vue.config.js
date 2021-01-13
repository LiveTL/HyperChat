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
              'src/submodules/chat/chat.js'
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
