<template>
  <div class="content text-center" @scroll="$forceUpdate()">
    <v-main style="height: 100%">
      <div style="vertical-align: bottom; height: 100vh; display: table-cell">
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
        center
        color="#0287C3"
        fab
        @click="scrollToBottom"
        v-show="!isAtBottom()"
      >
        <v-icon dark>mdi-arrow-down</v-icon>
      </v-btn>
    </v-fade-transition>
  </div>
</template>

<script>
export default {
  name: "ChatUI",
  props: ["dark"],
  data: () => ({
    messages: new Array(50),
    current: 0,
  }),
  metaInfo: {
    title: "YTC (Optimized)",
    titleTemplate: "%s | LiveTL",
  },
  created() {
    window.addEventListener("message", (d) => {
      if (d.data.type == "messageChunk") {
        d = JSON.parse(JSON.stringify(d.data));
        d.messages.forEach(async (message) => {
          await this.newMessage(message);
        });
      }
    });
  },
  methods: {
    async newMessage(message) {
      let wasAtBottom = this.isAtBottom();
      this.$set(this.messages, this.current, message);
      this.current++;
      this.current %= this.messages.length;
      await this.$nextTick();
      if (wasAtBottom) {
        this.scrollToBottom();
      }
    },
    isAtBottom() {
      let el = this.$el;
      if (!el) return true;
      return Math.round(el.clientHeight + el.scrollTop) >= el.scrollHeight;
    },
    scrollToBottom() {
      let bottom = this.$refs.bottomElement;
      bottom.scrollIntoView();
    },
    getMessages: function* () {
      for (let i = this.current; i < this.messages.length + this.current; i++) {
        let message = this.messages[i % this.messages.length];
        if (message != null) {
          yield {
            index: i,
            info: message,
          };
        }
      }
    },
  },
};
</script>

<style >
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
}

.animating {
  animation: 0.1s newMessageAnimation ease-in-out;
}

.content {
  overflow-y: scroll;
  height: 100vh;
}
</style>