<template>
  <div class="content" @scroll="$forceUpdate()">
    <v-main style="height: 100%">
      <div style="vertical-align: bottom; height: 100vh; width: 100vw; display: table-cell;">
        <div class="message animating text-left highlighted">
          Welcome to YouTube Chat, optimized by LiveTL!
          LiveTL Optimized YTC can lower CPU usage by over 90%.
        </div>
        <v-container fluid>
          <div
            v-for="message of getMessages()"
            :key="message.index"
            class="message animating text-left"
          >
            <strong>{{ message.info.author.name }}</strong
            >:
            {{ message.info.message }}
          </div>
        </v-container>
        <div ref="bottomElement"></div>
      </div>
    </v-main>
    <v-fade-transition>
      <v-btn
        elevation="3"
        fixed
        bottom
        style="left: 50%; transform: translateX(-50%);"
        color="#0287C3"
        fab
        @click="scrollToBottom"
        v-show="!isAtBottom()"
      >
        <v-icon>mdi-arrow-down</v-icon>
      </v-btn>
    </v-fade-transition>
  </div>
</template>

<script>
export default {
  name: 'ChatUI',
  data: () => ({
    messages: new Array(50),
    current: 0
  }),
  metaInfo: {
    title: 'YTC (Optimized)',
    titleTemplate: '%s | LiveTL'
  },
  created() {
    window.addEventListener('message', (d) => {
      if (d.data.type === 'messageChunk') {
        d = JSON.parse(JSON.stringify(d.data));
        d.messages.forEach(async(message) => {
          await this.newMessage(message);
        });
      }
    });
  },
  methods: {
    async newMessage(message) {
      const wasAtBottom = this.isAtBottom();
      this.$set(this.messages, this.current, message);
      this.current++;
      this.current %= this.messages.length;
      await this.$nextTick();
      if (wasAtBottom) {
        this.scrollToBottom();
      }
    },
    isAtBottom() {
      const el = this.$el;
      if (!el) return true;
      return Math.round(el.clientHeight + el.scrollTop) >= el.scrollHeight;
    },
    scrollToBottom() {
      const bottom = this.$refs.bottomElement;
      bottom.scrollIntoView();
    },
    getMessages: function * () {
      for (let i = this.current; i < this.messages.length + this.current; i++) {
        const message = this.messages[i % this.messages.length];
        if (message != null) {
          yield {
            index: i,
            info: message
          };
        }
      }
    }
  }
};
</script>

<style>

@keyframes newMessageAnimation {
  0% {
  }
  100% {
  }
}

.message {
  transform-origin: 0 100%;
  overflow: hidden;
  padding: 10px;
  text-overflow: ellipsis;
  color: white;
  mix-blend-mode: difference;
}

.animating {
  animation: 0.1s newMessageAnimation ease-in-out;
}

.content {
  overflow-y: scroll;
  height: 100vh;
}

html {
  overflow-y: hidden;
}

.highlighted {
  background-color: rgba(0, 119, 255, 0.8);
  margin: 30px;
  width: initial;
}
</style>
