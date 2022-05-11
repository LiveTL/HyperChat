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

  const badges: {
    name: string;
    href: string;
  }[] = [
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
    }
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
      <p>
        Optimized YouTube Chat
        /
        {#if !showChangelog}
          <a href="/" on:click={(e) => {
            $lastClosedVersion = '';
            $refreshScroll = true;
            e.preventDefault();
          }} class="underline dark:text-primary-50 text-primary-900">
            v{version}
          </a>
        {:else}
          v{version}
        {/if}
      </p>
      <div class="flex flex-wrap">
        {#each badges as badge, i}
          <p>
            <a 
              href={badge.href}
              class="underline dark:text-primary-50 text-primary-900"
              target="_blank"
            >
              {badge.name}
            </a>
          </p>
          {#if i !== badges.length - 1}
            <span style="margin: 0px 0.2em;">/</span>
          {/if}
        {/each}
      </div>
    </span>
  </div>
  {#if showChangelog}
    <p class="leading-tight mt-1.5 flex flex-row">
      <span href="/" on:click={(e) => {
        $lastClosedVersion = version;
        $refreshScroll = true;
        e.preventDefault();
      }}
      class="inline-block align-middle cursor-pointer pt-0.5 h-fit">
        <Icon xs class="text-error-200">
          close
        </Icon>
      </span>
      <span class="mr-0.5">
        <Changelog />
      </span>
    </p>
  {/if}
</div>
