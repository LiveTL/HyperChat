import { getWAR } from '@/modules/war.js';
// above line is replaced for LiveTL. DO NOT EDIT.

const isReplay = window.location.href.startsWith(
  'https://www.youtube.com/live_chat_replay'
);

const isFirefox = !!/Firefox/.exec(navigator.userAgent);

const formatTimestamp = (timestamp) => {
  return (new Date(parseInt(timestamp) / 1000)).toLocaleTimeString(navigator.language,
    { hour: '2-digit', minute: '2-digit' });
};

const getMillis = (timestamp, usec) => {
  let secs = Array.from(timestamp.split(':'), t => parseInt(t)).reverse();
  secs = secs[0] + (secs[1] ? secs[1] * 60 : 0) + (secs[2] ? secs[2] * 60 * 60 : 0);
  secs *= 1000;
  secs += usec % 1000;
  secs /= 1000;
  return secs;
};

const colorConversionTable = {
  4280191205: 'blue',
  4278248959: 'lightblue',
  4280150454: 'turquoise',
  4294953512: 'yellow',
  4294278144: 'orange',
  4293467747: 'pink',
  4293271831: 'red'
};

const messageReceiveCallback = async (response) => {
  response = JSON.parse(response);
  try {
    const messages = [];
    if (!response.continuationContents) {
      console.debug('Response was invalid', response);
      return;
    }
    (
      response.continuationContents.liveChatContinuation.actions || []
    ).forEach((action) => {
      try {
        let currentElement = action.addChatItemAction;
        if (action.replayChatItemAction != null) {
          const thisAction = action.replayChatItemAction.actions[0];
          currentElement = thisAction.addChatItemAction;
        }
        currentElement = (currentElement || {}).item;
        if (!currentElement) {
          return;
        }
        const messageItem = currentElement.liveChatTextMessageRenderer ||
          currentElement.liveChatPaidMessageRenderer ||
          currentElement.liveChatPaidStickerRenderer;
        if (!messageItem) {
          return;
        }
        if (!messageItem.authorName) {
          return;
        }
        messageItem.authorBadges = messageItem.authorBadges || [];
        const authorTypes = [];
        messageItem.authorBadges.forEach((badge) =>
          authorTypes.push(badge.liveChatAuthorBadgeRenderer.tooltip.toLowerCase())
        );
        const runs = [];
        if (messageItem.message) {
          messageItem.message.runs.forEach((run) => {
            if (run.text) {
              runs.push({
                type: 'text',
                text: decodeURIComponent(escape(unescape(encodeURIComponent(
                  run.text
                ))))
              });
            } else if (run.emoji) {
              runs.push({
                type: 'emote',
                src: run.emoji.image.thumbnails[0].url
              });
            }
          });
        }
        const timestampUsec = parseInt(messageItem.timestampUsec);
        const timestampText = (messageItem.timestampText || {}).simpleText;
        const date = new Date();
        const item = {
          author: {
            name: messageItem.authorName.simpleText,
            id: messageItem.authorExternalChannelId,
            types: authorTypes
          },
          message: runs,
          timestamp: isReplay
            ? timestampText
            : formatTimestamp(timestampUsec),
          showtime: isReplay ? getMillis(timestampText, timestampUsec)
            : date.getTime() - Math.round(timestampUsec / 1000)
        };
        if (currentElement.liveChatPaidMessageRenderer) {
          item.superchat = {
            amount: messageItem.purchaseAmountText.simpleText,
            color: colorConversionTable[messageItem.bodyBackgroundColor]
          };
        }
        messages.push(item);
      } catch (e) {
        console.debug('Error while parsing message.', { e });
      }
    });
    const chunk = {
      type: 'messageChunk',
      messages: messages,
      isReplay
    };
    document
      .querySelector('#optichat')
      .contentWindow.postMessage(chunk, '*');
  } catch (e) {
    console.debug(e);
  }
};

const hyperchatLoaded = async () => {
  const css = `
    .toggleButton {
      background-color: #094589;
      color: white;
      border: 4px solid;
      border-color: #86868682;
      font-size: 0.75em;
      height: 100%;
      width: fit-content;
      border-radius: 5px;
      cursor: default;
      user-select: none;
      float: right;
      padding: 2.5px;
      transition: 0.25s;
      display: none;
    }
    .toggleButton:hover {
      border-color: lightgray;
    }
    yt-live-chat-app {
      min-height: 0px;
      min-width: 0px;
    }
  `;
  const style = document.createElement('style');
  style.innerHTML = css;
  document.body.appendChild(style)
  const button = document.createElement('div');
  button.className = 'toggleButton';
  button.addEventListener('click', () => {
    localStorage.setItem('HC:ENABLED',
      localStorage.getItem('HC:ENABLED') !== 'true' ? 'true' : 'false');
    location.reload();
  });
  button.innerHTML = 'Enable HyperChat';
  let messageDisplay = {
    contentWindow: {
      postMessage: () => { }
    }
  };
  document.querySelector('#primary-content').appendChild(button);
  if (localStorage.getItem('HC:ENABLED') !== 'false') {
    button.innerHTML = 'Disable HyperChat';
    window.postMessage({
      'yt-player-video-progress': 0
    }, '*');
    window.postMessage({
      'yt-player-video-progress': 69420
    }, '*');
    const elem = document.querySelector('#chat>#item-list');
    if (!elem) return;
    await new Promise((resolve, reject) => {
      const poller = setInterval(() => {
        getWAR = getWAR || window.getWAR;
        if (getWAR) {
          if (!window.isAndroid) button.style.display = 'block';
          clearInterval(poller);
          resolve();
        }
      }, 100);
    });
    console.debug('Found definition of getWAR');
    const source = await getWAR(window.isLiveTL ? 'hyperchat/index.html' : 'index.html');
    elem.outerHTML = `
    <iframe id='optichat' src='${source}' style='border: 0px; width: 100%; height: 100%'></iframe>
    `;
    if (isFirefox) {
      const frame = document.querySelector('#optichat');
      const scale = 0.8;
      const inverse = `${Math.round((1 / scale) * 10000) / 100}%`;
      frame.style.transformOrigin = '0px 0px';
      frame.style.minWidth = inverse;
      frame.style.minHeight = inverse;
      frame.style.transform = `scale(${scale * 100}%)`;
    }
    document.querySelector('#ticker').remove();
    const script = document.createElement('script');
    script.innerHTML = `
    for (event_name of ["visibilitychange", "webkitvisibilitychange", "blur"]) {
      window.addEventListener(event_name, event => {
        event.stopImmediatePropagation();
      }, true);
    }
    window.fetchFallback = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0].url;
      const result = await window.fetchFallback(...args);
      if (url.startsWith(
        'https://www.youtube.com/youtubei/v1/live_chat/get_live_chat')
      ) {
        const response = JSON.stringify(await (await result.clone()).json());
        window.dispatchEvent(new CustomEvent('messageReceive', { detail: response }));
      }
      return result;
    };
  `;
    window.addEventListener('messageReceive', d => messageReceiveCallback(d.detail));
    document.body.appendChild(script);
    // window.postMessage({
    //   'yt-live-chat-set-dark-theme': true
    // }, '*');
    messageDisplay = document.querySelector('#optichat');
  }
  const html = document.querySelector('html');
  const sendTheme = () => {
    const theme = html.hasAttribute('dark');
    messageDisplay.contentWindow.postMessage({
      'yt-live-chat-set-dark-theme': theme
    }, '*');
  };
  new MutationObserver(sendTheme).observe(html, {
    attributes: true
  });
  window.addEventListener('message', d => {
    if (d.data.type === 'getTheme') {
      sendTheme();
    }
  });
};

window.addEventListener('load', hyperchatLoaded)
if (document.readyState == 'complete') hyperchatLoaded();
