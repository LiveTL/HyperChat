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
  const hyperChatEnabled = localStorage.getItem('HC:ENABLED') === 'true';

  const css = `
    .toggleButtonContainer {
      float: right;
    }
    .toggleButton {
      position: relative;
      display: flex;
      box-sizing: border-box;
      border: none;
      border-radius: 4px;
      padding: 0 10px;
      min-width: 64px;
      height: 24px;
      vertical-align: middle;
      text-align: center;
      text-overflow: ellipsis;
      text-transform: uppercase;

      border: 1px solid ${hyperChatEnabled ? '#30acffa1' : 'rgb(189, 189, 189)'};
      ${hyperChatEnabled ? 'color: #30acff;' : 'color: var(--yt-live-chat-secondary-text-color);'}
     
      
      font-family: var(--pure-material-font, "Roboto", "Segoe UI", BlinkMacSystemFont, system-ui, -apple-system);
      font-size: 14px;
      font-weight: 500;
      line-height: 24px;
      overflow: hidden;
      outline: none;
      cursor: pointer;
      transition: box-shadow 0.2s;
    }

    .toggleButton img {
      width: 23px;
      height: 23px;
      margin-right: 4px;
      ${hyperChatEnabled ? '' : `
        filter: grayscale(1);
      `}
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
      border: 1px solid #30acffa1;
      color: #30acff;
    }

    .toggleButton:hover img,
    .toggleButton:focus img {
      filter: grayscale(0.2);
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

    /**
     * Tooltip Styles (source: https://codepen.io/cbracco/pen/nufHz)
    */

    /* Base styles for the element that has a tooltip */
    [data-tooltip],
    .tooltip {
      position: relative;
      cursor: pointer;
    }

    /* Base styles for the entire tooltip */
    [data-tooltip]:before,
    [data-tooltip]:after,
    .tooltip:before,
    .tooltip:after {
      position: absolute;
      visibility: hidden;
      -ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=0)";
      filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=0);
      opacity: 0;
      -webkit-transition: 
        opacity 0.2s ease-in-out,
        visibility 0.2s ease-in-out,
        -webkit-transform 0.2s cubic-bezier(0.71, 1.7, 0.77, 1.24);
      -moz-transition:    
        opacity 0.2s ease-in-out,
        visibility 0.2s ease-in-out,
        -moz-transform 0.2s cubic-bezier(0.71, 1.7, 0.77, 1.24);
      transition:         
        opacity 0.2s ease-in-out,
        visibility 0.2s ease-in-out,
        transform 0.2s cubic-bezier(0.71, 1.7, 0.77, 1.24);
      -webkit-transform: translate3d(0, 0, 0);
      -moz-transform:    translate3d(0, 0, 0);
      transform:         translate3d(0, 0, 0);
      pointer-events: none;
    }

    /* Show the entire tooltip on hover and focus */
    [data-tooltip]:hover:before,
    [data-tooltip]:hover:after,
    [data-tooltip]:focus:before,
    [data-tooltip]:focus:after,
    .tooltip:hover:before,
    .tooltip:hover:after,
    .tooltip:focus:before,
    .tooltip:focus:after {
      visibility: visible;
      -ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=100)";
      filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=100);
      opacity: 1;
    }

    /* Base styles for the tooltip's directional arrow */
    .tooltip:before,
    [data-tooltip]:before {
      z-index: 1001;
      border: 6px solid transparent;
      background: transparent;
      content: "";
    }

    /* Base styles for the tooltip's content area */
    .tooltip:after,
    [data-tooltip]:after {
      z-index: 1000;
      padding: 8px;
      width: 120px;
      background-color: #000;
      background-color: hsla(0, 0%, 20%, 0.9);
      color: #fff;
      content: attr(data-tooltip);
      font-size: 14px;
      line-height: 1.2;
    }

    /* Directions */

    /* Top (default) */
    [data-tooltip]:before,
    [data-tooltip]:after,
    .tooltip:before,
    .tooltip:after,
    .tooltip-top:before,
    .tooltip-top:after {
      bottom: 100%;
      left: 50%;
    }

    [data-tooltip]:before,
    .tooltip:before,
    .tooltip-top:before {
      margin-left: -6px;
      margin-bottom: -12px;
      border-top-color: #000;
      border-top-color: hsla(0, 0%, 20%, 0.9);
    }

    /* Horizontally align top/bottom tooltips */
    [data-tooltip]:after,
    .tooltip:after,
    .tooltip-top:after {
      margin-left: -80px;
    }

    [data-tooltip]:hover:before,
    [data-tooltip]:hover:after,
    [data-tooltip]:focus:before,
    [data-tooltip]:focus:after,
    .tooltip:hover:before,
    .tooltip:hover:after,
    .tooltip:focus:before,
    .tooltip:focus:after,
    .tooltip-top:hover:before,
    .tooltip-top:hover:after,
    .tooltip-top:focus:before,
    .tooltip-top:focus:after {
      -webkit-transform: translateY(-12px);
      -moz-transform:    translateY(-12px);
      transform:         translateY(-12px); 
    }

    /* Left */
    .tooltip-left:before,
    .tooltip-left:after {
      right: 100%;
      bottom: 50%;
      left: auto;
    }

    .tooltip-left:before {
      margin-left: 0;
      margin-right: -12px;
      margin-bottom: 0;
      border-top-color: transparent;
      border-left-color: #000;
      border-left-color: hsla(0, 0%, 20%, 0.9);
    }

    .tooltip-left:hover:before,
    .tooltip-left:hover:after,
    .tooltip-left:focus:before,
    .tooltip-left:focus:after {
      -webkit-transform: translateX(-12px);
      -moz-transform:    translateX(-12px);
      transform:         translateX(-12px); 
    }

    /* Bottom */
    .tooltip-bottom:before,
    .tooltip-bottom:after {
      top: 100%;
      bottom: auto;
      left: 50%;
    }

    .tooltip-bottom:before {
      margin-top: -12px;
      margin-bottom: 0;
      border-top-color: transparent;
      border-bottom-color: #000;
      border-bottom-color: hsla(0, 0%, 20%, 0.9);
    }

    .tooltip-bottom:hover:before,
    .tooltip-bottom:hover:after,
    .tooltip-bottom:focus:before,
    .tooltip-bottom:focus:after {
      -webkit-transform: translateY(12px);
      -moz-transform:    translateY(12px);
      transform:         translateY(12px); 
    }

    /* Right */
    .tooltip-right:before,
    .tooltip-right:after {
      bottom: 50%;
      left: 100%;
    }

    .tooltip-right:before {
      margin-bottom: 0;
      margin-left: -12px;
      border-top-color: transparent;
      border-right-color: #000;
      border-right-color: hsla(0, 0%, 20%, 0.9);
    }

    .tooltip-right:hover:before,
    .tooltip-right:hover:after,
    .tooltip-right:focus:before,
    .tooltip-right:focus:after {
      -webkit-transform: translateX(12px);
      -moz-transform:    translateX(12px);
      transform:         translateX(12px); 
    }

    /* Move directional arrows down a bit for left/right tooltips */
    .tooltip-left:before,
    .tooltip-right:before {
      top: 3px;
    }

    /* Vertically center tooltip content for left/right tooltips */
    .tooltip-left:after,
    .tooltip-right:after {
      margin-left: 0;
      margin-bottom: -16px;
    }
  `;
  const style = document.createElement('style');
  style.innerHTML = css;
  document.body.appendChild(style);

  const buttonContainer = document.createElement('div');
  buttonContainer.setAttribute('data-tooltip', hyperChatEnabled ? 'Disable HyperChat' : 'Enable HyperChat');
  buttonContainer.className = 'toggleButtonContainer tooltip-bottom';

  const button = document.createElement('div');
  button.className = 'toggleButton';
  button.addEventListener('click', () => {
    localStorage.setItem('HC:ENABLED',
      hyperChatEnabled ? 'false' : 'true');
    location.reload();
  });
  // eslint-disable-next-line no-undef
  button.innerHTML = `<img src="${chrome.runtime.getURL((window.isLiveTL ? 'hyperchat' : 'assets') + '/logo-48.png')}" /> HC`;
  let messageDisplay = {
    contentWindow: {
      postMessage: () => { }
    }
  };
  buttonContainer.appendChild(button);
  document.querySelector('#primary-content').appendChild(buttonContainer);
  if (hyperChatEnabled) {
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
          if (!window.isAndroid) button.style.display = 'flex';
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

    messageDisplay = document.querySelector('#optichat');
  } else {
    button.style.display = 'flex';
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
