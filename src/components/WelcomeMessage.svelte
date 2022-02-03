<script lang="ts">
  import { Browser, getBrowser, isLiveTL } from '../ts/chat-constants';
  import { updates } from '../changelog.js';
  import { fade } from 'svelte/transition';

  const latest = updates[updates.length - 1];
  const logo = chrome.runtime.getURL(
    (isLiveTL ? 'hyperchat' : 'assets') + '/logo.png'
  );
  const reviewLink = getBrowser() === Browser.FIREFOX
    ? 'https://addons.mozilla.org/en-US/firefox/addon/hyperchat/'
    : 'https://chrome.google.com/webstore/detail/hyperchat-optimized-youtu/naipgebhooiiccifflecbffmnjbabdbh';
  const classes = 'p-2 rounded inline-flex flex-col overflow-hidden ' +
   'bg-secondary-50 dark:bg-secondary-600 w-full';

  const badges = [
    {
      name: 'Review',
      href: reviewLink
    },
    {
      name: 'GitHub',
      href: 'https://github.com/LiveTL/LiveTL/'
    },
    {
      name: 'Discord',
      href: 'https://discord.gg/uJrV3tmthg'
    },
    {
      name: 'Donate',
      href: 'https://opencollective.com/livetl'
    },
  ];
</script>

<div class={classes}>
  <div class="flex items-center w-full">
    <div>
      <img class="rounded-full" width="44" height="44" src={logo} alt="logo">
    </div>
    <span class="ml-3 leading-tight">
      <h5 class="font-bold">HyperChat by LiveTL</h5>
      <p>Optimized YouTube Chat</p>
    </span>
  </div>
  <div class="flex flex-wrap leading-tight">
    {#each badges as { name, href }, i}
      <p class="mr-1 mt-1">
        <a {href} class="underline" target="_blank">
          {name}
        </a>
        {#if i != badges.length - 1}
          /
        {/if}
      </p>
    {/each}
  </div>
</div>
