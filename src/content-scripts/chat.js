import { getWAR } from '../modules/war.js';

const isReplayChat = () => {
  return window.location.href.startsWith(
    'https://www.youtube.com/live_chat_replay'
  );
};

const parseTimestamp = (timestamp) => {
  return (new Date(parseInt(timestamp) / 1000)).toLocaleTimeString(navigator.language,
    { hour: '2-digit', minute: '2-digit' });
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
        messageItem.authorBadges = messageItem.authorBadges || [];
        const authorTypes = [];
        messageItem.authorBadges.forEach((badge) =>
          authorTypes.push(badge.liveChatAuthorBadgeRenderer.tooltip)
        );
        let messageText = '';
        messageItem.message.runs.forEach((run) => {
          if (run.text) messageText += run.text;
        });
        messageText = decodeURIComponent(escape(unescape(encodeURIComponent(messageText))));
        if (!messageText) return;
        const item = {
          author: {
            name: messageItem.authorName.simpleText,
            id: messageItem.authorExternalChannelId,
            types: authorTypes
          },
          message: messageText,
          timestamp: isReplayChat()
            ? messageItem.timestampText.simpleText
            : parseTimestamp(messageItem.timestampUsec),
          timestampUsec: parseInt(messageItem.timestampUsec)
        };
        messages.push(item);
      } catch (e) {
        console.debug('Error while parsing message.', { e });
      }
    });
    const chunk = {
      type: 'messageChunk',
      messages: messages
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
  const script = document.createElement('script');
  script.innerHTML = `
    window.oldFetch = window.oldFetch || window.fetch;
    window.fetch = async (...args) => {
      const url = args[0].url;
      const result = await window.oldFetch(...args);
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
};

loaded();
