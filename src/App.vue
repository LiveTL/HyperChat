<template>
  <v-app>
    <div class="content" ref="content" @scroll="isAtBottom = checkIfBottom()">
      <div
        style="
          vertical-align: bottom;
          height: 100vh;
          width: 100vw;
          display: table-cell;
        "
        :class="{
          lowpadding: true,
          dark: Boolean($vuetify.theme.dark)
        }"
      >
        <div
          v-for="message of getMessages()"
          :key="message.index"
          class="messageContainer"
        >
          <div v-if="message.info.welcomeMessage" class="message text-left highlighted"
            v-show="message.shown">
            <span style="margin-bottom: 5px; display: inline-block">
              <strong style="font-size: 1.5em">
                <img
                  src="./../assets/logo.png"
                  style="
                    height: 2.5em;
                    vertical-align: middle;
                    border-radius: 100%;
                    border: 0.25em solid gray;
                    margin-right: 5px;
                    background-color: white;
                  "
                />
                Welcome to HyperChat by LiveTL!
              </strong>
            </span>
            <br />
            <span>
              <i>It may take a few seconds for messages to start appearing.</i>
              <br />
              <strong>HyperChat can reduce CPU usage by up to 80%!</strong>
              <span style="font-size: 1em; display: inline-block">
                Don't forget to
                <CustomLink
                  href="#/review"
                  >drop a 5-star review</CustomLink
                >,
                <CustomLink
                  href="https://livetl.app/hyperchat"
                  >share with your friends</CustomLink
                >, <CustomLink
                  href="https://discord.gg/uJrV3tmthg"
                  >join our Discord server</CustomLink
                >,
                <CustomLink
                  href="https://github.com/LiveTL/HyperChat"
                  >star the GitHub repository</CustomLink
                >, and <CustomLink
                  href="https://opencollective.com/livetl"
                  >
                  chip in a few dollars to help fund future projects (stay tuned)</CustomLink>!
              </span>
              <br /><br />
              <strong>NEW IN {{ update.version }}:</strong> {{ update.comments }}
            </span>
          </div>
          <div
            v-else
            :id="`message${message.index}`"
            :class="{
              message: true,
              'text-left': true,
              superchat: message.info.superchat != null,
            }"
            v-show="message.shown"
            :style="{
              backgroundColor: message.info.superchat
                ? `var(--${message.info.superchat.color}) !important`
                : null,
            }"
          >
            <strong
              style="margin-right: 5px; text-decoration: underline"
              v-if="message.info.superchat"
              >{{ message.info.superchat.amount }}</strong
            >
            <strong
              style="margin-right: 5px"
              :class="
                (message.info.author.types || []).map((d) => d.split(' ')[0])
              "
            >
              {{ message.info.author.name }}
            </strong>
            <span
              v-for="(run, key, index) in message.info.message"
              :key="index"
              :class="{ deleted: message.info.deleted }"
            >
              <span v-if="run.type == 'text'">{{ run.text }}</span>
              <a v-else-if="run.type == 'link'" :href="run.url" target="_blank">{{ run.text }}</a>
              <img
                v-else-if="run.type == 'emote' && run.src"
                :src="run.src"
                class="chatEmote"
              />
            </span>
          </div>
        </div>
        <div ref="lastMessage"></div>
      </div>
      <v-fade-transition>
        <v-btn
          elevation="3"
          fixed
          bottom
          style="left: 50%; transform: translateX(-50%)"
          color="#0287C3"
          fab
          @click="scrollToBottom"
          v-show="!isAtBottom"
        >
          <v-icon>mdi-arrow-down</v-icon>
        </v-btn>
      </v-fade-transition>
    </div>
  </v-app>
</template>

<script>
import CustomLink from './CustomLink.vue';
import { updates } from './changelog.js';

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
}
const CHAT_HISTORY_SIZE = 250;
export default {
  name: 'ChatUI',
  data: () => {
    return {
      messages: new Array(CHAT_HISTORY_SIZE),
      current: 0,
      queued: new Queue(),
      isAtBottom: true,
      progress: {
        current: null,
        previous: null
      },
      interval: null,
      update: updates[updates.length - 1],
      showWelcome: 'future'
    };
  },
  metaInfo: {
    title: 'YTC (Optimized)',
    titleTemplate: '%s | LiveTL'
  },
  created() {
    this.$set(this.messages, 0, { welcomeMessage: true });
    window.addEventListener('resize', async () => {
      // await this.$nextTick();
      // await this.$forceUpdate();
      this.scrollToBottom();
    });

    const processMessagePayload = (payload) => {
      if (!payload.isReplay && !this.interval) {
        const runQueue = () => this.videoProgressUpdated(Date.now() / 1000);
        this.interval = setInterval(runQueue, 250);
        runQueue();
        runQueue();
      }
      /** Separate each action */
      const messages = payload.messages;
      const bonks = payload.bonks;
      const deletions = payload.deletions;
      /** Sort and add messages to queue */
      for (const message of messages.sort(
        (m1, m2) => m1.showtime - m2.showtime
      )) {
        this.checkDeleted(message, bonks, deletions);
        this.queued.push({
          timestamp: message.showtime / 1000,
          message: message
        });
      }
      /** Handle deletions and bonks */
      const wasBottom = this.checkIfBottom();
      this.messages.forEach((message) =>
        this.checkDeleted(message, bonks, deletions)
      );
      if ((payload.isInitial || payload.isReplay) && this.showWelcome === 'future') {
        this.showWelcome = 'now';
      }
      if (wasBottom) {
        this.$nextTick(this.scrollToBottom);
      }
    };

    window.addEventListener('message', async (message) => {
      const data = message.data;
      /** Connect to background messaging as client */
      if (data.type === 'frameInfo') {
        const port = chrome.runtime.connect();
        port.postMessage({
          type: 'registerClient',
          frameInfo: data.frameInfo,
          getInitialData: true
        });
        port.onMessage.addListener((payload) => {
          if (payload.type === 'actionChunk') {
            processMessagePayload(payload);
          } else if (payload.type === 'playerProgress' && !this.interval) {
            this.videoProgressUpdated(payload.playerProgress);
          }
        });
      }
      /** Handle YT values */
      const d = JSON.parse(JSON.stringify(data));
      this.isAtBottom = this.checkIfBottom();
      if (d['yt-live-chat-set-dark-theme'] != null) {
        this.$vuetify.theme.dark = d['yt-live-chat-set-dark-theme'];
        localStorage.setItem('dark_theme', this.$vuetify.theme.dark.toString());
      }
    });
    window.parent.postMessage(
      {
        type: 'getTheme'
      },
      '*'
    );
    this.$nextTick(this.scrollToBottom);
  },
  methods: {
    async newMessage(message) {
      this.$set(this.messages, this.current, message);
      this.current++;
      this.current %= this.messages.length;
      if (this.isAtBottom) {
        await this.$nextTick();
        this.scrollToBottom();
        // await this.$forceUpdate();
      }
    },
    async videoProgressUpdated(time) {
      if (time < 0) return;
      this.progress.current = time;
      if (
        Math.abs(this.progress.previous - this.progress.current) > 1 ||
        this.progress.current == null
      ) {
        // scrubbed or skipped
        while (this.queued.top) {
          this.newMessage(this.queued.pop().data.message);
        }
        this.isAtBottom = true;
      } else {
        while (
          this.queued.top != null &&
          this.queued.top.data.timestamp <= this.progress.current
        ) {
          const item = this.queued.pop();
          if (this.isAtBottom) {
            this.newMessage(item.data.message);
          }
        }
      }
      this.progress.previous = this.progress.current;
      if (this.showWelcome === 'now') {
        this.newMessage({ welcomeMessage: true });
        this.showWelcome = 'done';
      }
    },
    checkIfBottom() {
      const el = this.$refs.content;
      if (!el) return true;
      return Math.ceil(window.innerHeight + el.scrollTop) >= el.scrollHeight - 2;
    },
    scrollToBottom() {
      this.$refs.content.scrollTop = this.$refs.content.scrollHeight;
      // this.$vuetify.goTo(this.$refs.lastMessage, { container: this.$refs.content });
    },
    getMessages: function * () {
      for (let i = 0; i < 2 * this.messages.length - 1; i++) {
        const message = this.messages[i % this.messages.length];
        yield {
          index: i,
          info: message || {
            author: {},
            message: []
          },
          shown:
            message != null &&
            i >= this.current &&
            i < this.messages.length + this.current
        };
      }
    },
    checkDeleted(message, bonks, deletions) {
      if (message.welcomeMessage) return;
      for (const bonk of bonks) {
        if (bonk.authorId === message.author.id) {
          message.message = bonk.replacedMessage;
          message.deleted = true;
          return;
        }
      }
      for (const deletion of deletions) {
        if (deletion.messageId === message.messageId) {
          message.message = deletion.replacedMessage;
          message.deleted = true;
          return;
        }
      }
    }
  },
  components: {
    CustomLink
  }
};
</script>

<style>
:root {
  --accent: rgba(0, 119, 255, 0.5);
  --blue: #6fa9ff;
  --lightblue: #00bdff;
  --turquoise: #1de9b7;
  --yellow: #ffc928;
  --orange: #f67c00;
  --pink: #fa3664;
  --red: #f63413;
}
.message {
  transform-origin: 0 100%;
  overflow: hidden;
  padding: 6px;
  text-overflow: ellipsis;
}
.messageContainer:nth-child(odd) {
  background-color: #86868621;
}
.content {
  overflow-y: scroll;
  height: 100vh;
  scrollbar-width: thin;
  padding: 0px;
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
  overflow-y: hidden !important;
}
.highlighted {
  background-color: var(--accent) !important;
  margin: 10px 0px 10px 0px;
  padding: 10px;
  width: initial;
}
.chatEmote {
  vertical-align: sub;
  height: 1.5em;
  width: 1.5em;
  margin: 0px 0.2em 0px 0.2em;
}
.dark .moderator {
  color: #A0BDFC !important;
}
.moderator {
  color: #2441C0 !important;
}
.dark .owner {
  color: #FFD600 !important;
}
.owner {
  color: #866518 !important;
}
.dark .member,
.dark .new {
  color: #04B301;
}
.member,
.new {
  color: #0E5D10;
}
.deleted {
  font-style: italic;
  color: #6E6B6B;
}
.dark .deleted {
  color: #898888;
}
.superchat {
  margin: 15px 0px 15px 0px;
  color: black;
}
.lowpadding {
  padding: 0px 10px 0px 10px !important;
}
* {
  overflow-wrap: anywhere;
}
a {
  color: inherit !important;
}
</style>
