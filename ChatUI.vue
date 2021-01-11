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
            :id="`message${message.index}`"
            class="message animating text-left"
          >
            <strong style="margin-right: 5px;">
              {{ message.info.author.name }}
            </strong>
            <span v-for="(run, key, index) in message.info.message" :key="index">
              <span :v-if="run.type == 'text'">{{ run.text }}</span>
              <img :v-else-if="run.type == 'emote'" :src="run.src" class="chatEmote" />
            </span>
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
    window.addEventListener('resize', async() => {
      await this.$nextTick();
      await this.$forceUpdate();
    });
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
            if (wasAtBottom) {
              await this.newMessage(this.queued.pop().data.message);
            }
          }
        }
        await this.$nextTick();
        if (wasAtBottom) this.scrollToBottom();
        this.progress.previous = this.progress.current;
      } else if (d.type === 'messageChunk') {
        d.messages.forEach(async(message) => {
          if (!d.isReplay) {
            setTimeout(async() => {
              wasAtBottom = this.isAtBottom();
              if (wasAtBottom) {
                await this.newMessage(message);
                await this.$nextTick();
                this.scrollToBottom();
              }
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
      return Math.round(el.clientHeight + el.scrollTop + 15) >= el.scrollHeight;
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
  scrollbar-width: thin;
}

.content::-webkit-scrollbar {
    width: 4px;
}

.content::-webkit-scrollbar-track {
    background: transparent;
}

.content::-webkit-scrollbar-thumb {
    background: #888;
}

.content::-webkit-scrollbar-thumb:hover {
    background: #555;
}

html {
  overflow-y: hidden;
}

.highlighted {
  background-color: rgba(0, 119, 255, 0.5);
  margin: 30px 30px 0px 30px;
  width: initial;
}

.chatEmote {
  vertical-align: sub;
  height: 1.5em;
  margin: 0px 0.2em 0px 0.2em;
}
</style>
