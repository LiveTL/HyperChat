import { getWAR } from '../../modules/war.js';

const isReplay = window.location.href.startsWith(
  'https://www.youtube.com/live_chat_replay'
);

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

const messageReceiveCallback = async(response) => {
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
        const currentElement = (
          action.addChatItemAction ||
              (action.replayChatItemAction != null
                ? action.replayChatItemAction.actions[0].addChatItemAction
                : null) ||
              {}
        ).item;
        if (!currentElement) return;
        const messageItem = currentElement.liveChatTextMessageRenderer;
        if (!messageItem) return;
        if (!messageItem.authorName) return;
        messageItem.authorBadges = messageItem.authorBadges || [];
        const authorTypes = [];
        messageItem.authorBadges.forEach((badge) =>
          authorTypes.push(badge.liveChatAuthorBadgeRenderer.tooltip.toLowerCase())
        );
        const runs = [];
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
          } else {
            console.log(messageItem);
          }
        });
        if (!runs) return;
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

const loaded = async() => {
  const elem = document.querySelector('#chat>#item-list');
  if (!elem) return;
  elem.outerHTML = `
    <iframe id='optichat' src='${await getWAR('index.html')
    }#/chat' style='border: 0px; width: 100%; height: 100%'></iframe>
  `;
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
        const response = await (await result.clone()).json();
        window.dispatchEvent(new CustomEvent('messageReceive', { detail: response }));
      }
      return result;
    };
  `;
  window.addEventListener('messageReceive', d => messageReceiveCallback(d.detail));
  document.body.appendChild(script);
  window.postMessage({
    'yt-live-chat-set-dark-theme': true
  }, '*');
  const messageDisplay = document.querySelector('#optichat');
  window.addEventListener('message', d => {
    messageDisplay.contentWindow.postMessage(d.data, '*');
  });
};

loaded();
