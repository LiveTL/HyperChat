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

  const d = new Date();
  const kiaraBday = (true || (d.getFullYear() === 2022 && d.getMonth() === 6 && d.getDate() >= 5 /* && d.getDate() <= 8 */));
  let kiaraBdayActive = false;
  const getURL = (asset: string) => chrome.runtime.getURL((isLiveTL ? 'hyperchat' : 'assets') + `/${asset}`);
</script>

<div class={classes} style={kiaraBdayActive ? 'background-color: #ffb826' : ''}>
  <div class="flex items-center w-full">
    <div class="relative">
      <img class="rounded-full" width="44" height="44" src={logo} alt="logo">
      {#if kiaraBday}
        <img src={getURL('kiara-hat.png')} class="kiwawa-hat cursor-pointer" alt="Takanashi Kiara's Birthday Surprise" on:click={() => {
          kiaraBdayActive = !kiaraBdayActive;
        }}>
      {/if}
    </div>
    <span class="ml-2 leading-tight {kiaraBdayActive ? 'text-black' : ''}">
      <h5 class="font-bold">HyperChat by {kiaraBdayActive ? 'KFP' : 'LiveTL'}</h5>
      <p>
        {#if kiaraBdayActive}
          Happy Birthday Kiwawa!
        {:else}
          Optimized YouTube Chat
          /
          {#if !showChangelog}
            <a href="/" on:click={(e) => {
              $lastClosedVersion = '';
              $refreshScroll = true;
              e.preventDefault();
            }} class="underline text-primary-900 {kiaraBdayActive ? '' : 'dark:text-primary-50'}">
              v{version}
            </a>
          {:else}
            v{version}
          {/if}
        {/if}
      </p>
      <div class="flex flex-wrap">
        {#each badges as badge, i}
          <p>
            <a 
              href={badge.href}
              class="underline text-primary-900 {kiaraBdayActive ? '' : 'dark:text-primary-50'}"
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
        <Icon xs class="{kiaraBdayActive ? 'text-error-800' : 'text-error-500 dark:text-error-200'} font-bold">
          close
        </Icon>
      </span>
      <span class="mr-0.5 {kiaraBdayActive ? 'text-black' : ''}">
        <Changelog />
      </span>
    </p>
  {/if}
</div>

<style>
  @keyframes float {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-3px);
    }
    100% {
      transform: translateY(0);
    }
  }
  .kiwawa-hat {
    position: absolute;
    top: -10px;
    left: -5px;
    max-width: unset;
    width: 55px;
    animation: float 1s ease-in-out infinite;
  }
</style>
