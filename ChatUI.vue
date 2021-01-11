<template>
  <div class="content" ref="content" @scroll="$forceUpdate()">
    <v-main style="height: 100%">
      <div style="vertical-align: bottom; height: 100vh; width: 100vw; display: table-cell;">
        <div class="message text-left highlighted">
          Welcome to YouTube Chat, optimized by LiveTL!
          Optimized YTC can lower CPU usage by up to 80%.
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
class Queue {
  constructor() {
    this.clear();
  }

  clear() {
    this.top = null;
    this.last = this.top;
  }

  pop() {
    const front = this.top;
    this.top = this.top.next;
    if (front === this.last) {
      this.last = null;
    }
    return front;
  }

  push(item) {
    const newItem = { data: item };
    if (this.last === null) {
      this.top = newItem;
      this.last = this.top;
    } else {
      this.last.next = newItem;
      this.last = newItem;
    }
  }
};

export default {
  name: 'ChatUI',
  data: () => ({
    messages: new Array(250),
    current: 0,
    queued: new Queue(),
    progress: {
      current: null,
      previous: null
    }
  }),
  metaInfo: {
    title: 'YTC (Optimized)',
    titleTemplate: '%s | LiveTL'
  },
  created() {
    window.addEventListener('message', async(d) => {
      d = JSON.parse(JSON.stringify(d.data));
      let wasAtBottom = this.isAtBottom();
      if (d['yt-player-video-progress']) {
        this.progress.current = d['yt-player-video-progress'];
        if (Math.abs(this.progress.previous - this.progress.current) > 1 || this.progress.current == null) {
          // scrubbed or skipped
          while (this.queued.top) {
            await this.newMessage(this.queued.pop().data.message);
          }
          wasAtBottom = true;
        } else {
          while (this.queued.top != null && this.queued.top.data.timestamp <= this.progress.current) {
            await this.newMessage(this.queued.pop().data.message);
          }
        }
        await this.$nextTick();
        if (wasAtBottom) this.scrollToBottom();
        this.progress.previous = this.progress.current;
        console.log(this.progress.current, this.queued);
      } else if (d.type === 'messageChunk') {
        d.messages.forEach(async(message) => {
          if (!d.isReplay) {
            setTimeout(async() => {
              wasAtBottom = this.isAtBottom();
              await this.newMessage(message);
              await this.$nextTick();
              if (wasAtBottom) this.scrollToBottom();
            }, message.showtime);
          } else {
            this.queued.push({
              timestamp: message.showtime,
              message: message
            });
          }
        });
      }
    });
  },
  methods: {
    async newMessage(message) {
      this.$set(this.messages, this.current, message);
      this.current++;
      this.current %= this.messages.length;
    },
    isAtBottom() {
      const el = this.$el;
      if (!el) return true;
      return Math.round(el.clientHeight + el.scrollTop) >= el.scrollHeight;
    },
    scrollToBottom() {
      this.$refs.content.scrollTop = this.$refs.content.scrollHeight;
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
  background-color: rgba(0, 119, 255, 0.5);
  margin: 0px 30px 0px 30px;
  width: initial;
}
</style>
