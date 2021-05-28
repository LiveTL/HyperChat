import { getWAR } from '@/modules/war.js';
// above line is replaced for LiveTL. DO NOT EDIT.

for (const eventName of ['visibilitychange', 'webkitvisibilitychange', 'blur']) {
  window.addEventListener(eventName, e => e.stopImmediatePropagation(), true);
}

const isReplay = window.location.href.startsWith(
  'https://www.youtube.com/live_chat_replay'
);

window.isFirefox = window.isFirefox || !!/Firefox/.exec(navigator.userAgent);

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
  if (document.querySelector('.toggleButton')) return;
  document.body.style.minWidth = document.body.style.minHeight = '0px';
  const css = `
    .toggleButton {
      position: relative;
      display: inline-block;
      float: right;
      box-sizing: border-box;
      border: none;
      border-radius: 4px;
      padding: 0 16px;
      min-width: 64px;
      height: 24px;
      vertical-align: middle;
      text-align: center;
      text-overflow: ellipsis;
      text-transform: uppercase;
      color: rgb(var(--pure-material-onprimary-rgb, 255, 255, 255));
      background-color: rgb(var(--pure-material-primary-rgb, 33, 150, 243));
      box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
      font-family: var(--pure-material-font, "Roboto", "Segoe UI", BlinkMacSystemFont, system-ui, -apple-system);
      font-size: 13px;
      font-weight: 500;
      line-height: 26px;
      overflow: hidden;
      outline: none;
      cursor: pointer;
      transition: box-shadow 0.2s;
    }

    .toggleButton::-moz-focus-inner {
        border: none;
    }

    /* Overlay */
    .toggleButton::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgb(var(--pure-material-onprimary-rgb, 255, 255, 255));
        opacity: 0;
        transition: opacity 0.2s;
    }

    /* Hover, Focus */
    .toggleButton:hover,
    .toggleButton:focus {
      box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);
    }

    /* Ripple */
    .toggleButton::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        border-radius: 50%;
        padding: 50%;
        width: 32px; /* Safari */
        height: 32px; /* Safari */
        background-color: rgb(var(--pure-material-onprimary-rgb, 255, 255, 255));
        opacity: 0;
        transform: translate(-50%, -50%) scale(1);
        transition: opacity 1s, transform 0.5s;
    }

    .toggleButton:hover::before {
        opacity: 0.08;
    }

    .toggleButton:focus::before {
        opacity: 0.24;
    }

    .toggleButton:hover:focus::before {
        opacity: 0.3;
    }

    .toggleButton:active::after {
        opacity: 0.32;
        transform: translate(-50%, -50%) scale(0);
        transition: transform 0s;
    }

    /* Disabled */
    .toggleButton:disabled {
        color: rgba(var(--pure-material-onsurface-rgb, 0, 0, 0), 0.38);
        background-color: rgba(var(--pure-material-onsurface-rgb, 0, 0, 0), 0.12);
        box-shadow: none;
        cursor: initial;
    }

    .toggleButton:disabled::before {
        opacity: 0;
    }

    .toggleButton:disabled::after {
        opacity: 0;
    }
    yt-live-chat-app {
      min-height: 0px;
      min-width: 0px;
    }
  `;
  const style = document.createElement('style');
  style.innerHTML = css;
  document.body.appendChild(style);
  const button = document.createElement('div');
  button.className = 'toggleButton';
  button.addEventListener('click', () => {
    localStorage.setItem('HC:ENABLED',
      localStorage.getItem('HC:ENABLED') !== 'true' ? 'true' : 'false');
    location.reload();
  });
  button.innerHTML = 'Enable HC';
  let messageDisplay = {
    contentWindow: {
      postMessage: () => { }
    }
  };
  document.querySelector('#primary-content').appendChild(button);
  if (localStorage.getItem('HC:ENABLED') !== 'false') {
    button.innerHTML = 'Disable HC';
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
    <iframe id='optichat' src='${source}${(!window.isAndroid && window.isLiveTL ? '#isLiveTL' : '')}' style='border: 0px; width: 100%; height: 100%'></iframe>
    `;
    if (window.isFirefox || window.isAndroid || window.isLiveTL) {
      const frame = document.querySelector('#optichat');
      const scale = 0.8;
      const inverse = `${Math.round((1 / scale) * 10000) / 100}%`;
      frame.style.transformOrigin = '0px 0px';
      frame.style.minWidth = inverse;
      frame.style.minHeight = inverse;
      frame.style.transform = `scale(${scale})`;
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
  } else {
    button.style.display = 'block';
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
    } else if (d.data['yt-player-video-progress'] != null && messageDisplay.contentWindow) {
      messageDisplay.contentWindow.postMessage(d.data, '*');
    }
  });
};

window.addEventListener('load', hyperchatLoaded);
if (document.readyState === 'complete') hyperchatLoaded();
