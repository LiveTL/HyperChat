<script lang="ts">
  import { lastClosedVersion, refreshScroll } from '../ts/storage';
  import { Browser, getBrowser, isLiveTL } from '../ts/chat-constants';
  import Changelog from './changelog/Changelog.svelte';
  import { version } from '../manifest.json';
  import Icon from './common/Icon.svelte';

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

  $: showChangelog = $lastClosedVersion !== version;
</script>

<div class={classes}>
  <div class="flex items-center w-full">
    <div>
      <img class="rounded-full" width="44" height="44" src={logo} alt="logo">
    </div>
    <span class="ml-2 leading-tight">
      <h5 class="font-bold">HyperChat by LiveTL</h5>
      <p>Optimized YouTube Chat</p>
      <div class="flex flex-wrap">
        {#each badges as { name, href }, i}
          <p class="mr-1">
            <a {href} class="underline text-primary-50" target="_blank">
              {name}
            </a>
            {#if i != badges.length - 1}
              /
            {/if}
          </p>
        {/each}
      </div>
    </span>
  </div>
  <p class="leading-tight mt-1.5">
    {#if showChangelog}
      <strong class="mr-0.5">
        New in v{version}:
      </strong>
      <Changelog />
    {:else}
      <a href="/" on:click={(e) => {
        $lastClosedVersion = '';
        e.preventDefault();
      }} class="underline">
        See what's new in v{version}
      </a>
    {/if}
  </p>
</div>
