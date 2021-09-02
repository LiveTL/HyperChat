<script lang="ts">
  import { Browser, BROWSER, isLiveTL } from '../ts/chat-constants';
  import { updates } from '../changelog.js';

  const latest = updates[updates.length - 1];
  const logo = chrome.runtime.getURL(
    (isLiveTL ? 'hyperchat' : 'assets') + '/logo.png'
  );
  const reviewLink = BROWSER === Browser.FIREFOX
    ? 'https://addons.mozilla.org/en-US/firefox/addon/hyperchat/'
    : 'https://chrome.google.com/webstore/detail/hyperchat-optimized-youtu/naipgebhooiiccifflecbffmnjbabdbh';
  const classes = 'p-2 rounded inline-flex flex-col gap-2 overflow-hidden ' +
   'bg-secondary-50 dark:bg-secondary-600 w-full';
</script>

<div class={classes}>
  <div class="flex items-center">
    <div>
      <img class="rounded-full" width="44" height="44" src={logo} alt="logo">
    </div>
    <h5 class="font-bold ml-3">HyperChat by LiveTL</h5>
  </div>
  <div>
    <i>It may take a few seconds for messages to start appearing.</i>
    <br/>
    <strong>HyperChat can reduce CPU usage by up to 80%!</strong>
  </div>
  <div>
    <span>Don't forget to </span>
    <a href={reviewLink} target="_blank" class="underline">
      drop a 5-star review,
    </a>
    <a href="https://livetl.app/hyperchat" target="_blank" class="underline">
      share with your friends,
    </a>
    <a href="https://discord.gg/uJrV3tmthg" target="_blank" class="underline">
      join our Discord server,
    </a>
    <a href="https://github.com/LiveTL/HyperChat" target="_blank" class="underline">
      star the GitHub repository,
    </a>
    <span>and</span>
    <a href="https://opencollective.com/livetl" target="_blank" class="underline">
      chip in a few dollars to help fund future projects (stay tuned)!
    </a>
  </div>
  <div>
    <strong>NEW IN {latest?.version}:</strong>
    <span>{latest?.comments}</span>
  </div>
</div>
