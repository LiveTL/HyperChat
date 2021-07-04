import { getFrameInfoAsync } from './chat-utils.js';

const isLiveTL = false;
// DO NOT EDIT THE ABOVE LINE, it will be updated by webpack.
const isFirefox = navigator.userAgent.includes('Firefox');

const chatLoaded = () => {
  /** Workaround for https://github.com/LiveTL/HyperChat/issues/12 */
  if (chrome.windows) return;

  if (document.querySelector('.toggleButton')) {
    console.debug('HC Button already injected.');
    return;
  }

  document.body.style.minWidth = document.body.style.minHeight = '0px';
  const hyperChatEnabled = localStorage.getItem('HC:ENABLED') !== 'false';

  /** Inject CSS */
  const css = `
    .toggleButtonContainer {
      float: right;
    }
    .toggleButton {
      position: relative;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      border: none;
      border-radius: 4px;
      padding: 4px 10px;
      margin: -2px 0;
      min-width: 64px;
      height: 28px;
      text-align: center;
      text-overflow: ellipsis;
      text-transform: uppercase;

      ${hyperChatEnabled ? 'color: #30acff;' : 'color: var(--yt-live-chat-secondary-text-color);'}
      
      font-family: var(--pure-material-font, "Roboto", "Segoe UI", BlinkMacSystemFont, system-ui, -apple-system);
      font-size: 15px;
      font-weight: 500;
      overflow: hidden;
      outline: none;
      cursor: pointer;
      transition: box-shadow 0.2s;
    }

    .toggleButton img {
      width: 30px;
      height: 30px;
      margin: -3px 0;
      margin-right: 4px;
      ${hyperChatEnabled ? '' : `
        filter: saturate(0.8);
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
      background-color: rgb(255, 255, 255);
      opacity: 0;
      transition: opacity 0.2s;
    }

    /* Hover, Focus */
    .toggleButton:hover,
    .toggleButton:focus {
      background: rgba(0, 0, 0, 0.1);
      color: #30acff;
    }

    .toggleButton:hover img,
    .toggleButton:focus img {
      filter: saturate(0.8);
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
      text-align: center;
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

  /** Inject HC button */
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
  button.innerHTML = `<img src="${chrome.runtime.getURL((isLiveTL ? 'hyperchat' : 'assets') + '/logo-48.png')}" /> HC`;
  buttonContainer.appendChild(button);
  document.querySelector('#primary-content').appendChild(buttonContainer);
  button.style.display = 'flex';

  // Everything beyond this is only run if HyperChat is enabled.
  if (!hyperChatEnabled) return;

  // window.postMessage({
  //   'yt-player-video-progress': 0
  // }, '*');
  // window.postMessage({
  //   'yt-player-video-progress': 69420
  // }, '*');

  const ytcItemList = document.querySelector('#chat>#item-list');
  if (!ytcItemList) {
    console.debug('Unable to find YTC item-list.');
    return;
  }

  /** Inject optichat */
  const source = chrome.runtime.getURL(isLiveTL ? 'hyperchat/index.html' : 'index.html');
  ytcItemList.outerHTML = `
  <iframe id='optichat' src='${source}${(!window.isAndroid && isLiveTL ? '#isLiveTL' : '')}' style='border: 0px; width: 100%; height: 100%'></iframe>
  `;
  if (isFirefox || isLiveTL) {
    const frame = document.querySelector('#optichat');
    const scale = 0.8;
    const inverse = `${Math.round((1 / scale) * 10000) / 100}%`;
    frame.style.transformOrigin = '0px 0px';
    frame.style.minWidth = inverse;
    frame.style.minHeight = inverse;
    frame.style.transform = `scale(${scale})`;
  }
  document.querySelector('#ticker').remove();

  /** Forward theme and yt-player-video-progress to optichat */
  const optichat = document.querySelector('#optichat');
  const html = document.querySelector('html');
  const sendTheme = () => {
    const theme = html.hasAttribute('dark');
    optichat.contentWindow.postMessage({
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

  // Note: iframe readyState is always 'complete' even when it shouldn't be
  optichat.addEventListener('load', async () => {
    /** Forward frameInfo to optichat for background messaging */
    const frameInfo = await getFrameInfoAsync();
    optichat.contentWindow.postMessage(
      { type: 'frameInfo', frameInfo: frameInfo }, '*'
    );
  });
};

/**
 * Load on DOMContentLoaded or later.
 * Does not matter unless run_at is specified in extensions' manifest.
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', chatLoaded);
} else {
  chatLoaded();
}
