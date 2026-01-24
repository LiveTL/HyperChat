<script lang="ts">
  import { createPopup } from '../ts/chat-utils';
  import { isLiveTL } from '../ts/chat-constants';
  import outline from '../assets/outline.svg?raw';

  const isDark = document.documentElement.getAttribute('dark') === '';
  const openSettings = () => {
    createPopup(chrome.runtime.getURL(`${isLiveTL ? 'hyperchat/' : ''}options.html${isDark ? '?dark' : ''}`));
  };
</script>

<div id="hc-settings" on:click={openSettings} class="button">
  <div class="buttonIconContainer">
    <div class="buttonIcon">
      {@html outline}
    </div>
  </div>
  <div class="buttonLabel">HyperChat Settings</div>
</div>

<style>
  .button {
    display: flex;
    align-items: center;
    padding: 0px 36px 0px 16px;
    cursor: pointer;
    min-height: 36px;

    &:hover {
      background-color: var(--yt-spec-10-percent-layer);
    }
  }

  /* youtube studio dropdown popups use different color for hover */
  ytls-menu-popup-renderer .button:hover {
    background-color: var(--yt-spec-white-1-alpha-20);
  }

  .buttonLabel {
    color: var(--yt-spec-text-primary);
    white-space: nowrap;
    font-family: sans-serif;
    font-size: 1.4rem;
    line-height: 2rem;
    font-weight: 100;
    -webkit-font-smoothing: var(--paper-font-subhead_-_-webkit-font-smoothing);
  }

  .buttonIconContainer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    width: 24px;
    height: 24px;
  }
  
  .buttonIcon {
    flex: none;
    fill: var(--yt-spec-text-primary);
  }
</style>