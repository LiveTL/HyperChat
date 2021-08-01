<script lang="ts">
  import { Card } from 'smelte';
  import { Browser, BROWSER } from '../ts/chat-utils';

  const logo = chrome.runtime.getURL('assets/logo.png');
  const reviewLink = BROWSER === Browser.FIREFOX
    ? 'https://addons.mozilla.org/en-US/firefox/addon/hyperchat/'
    : 'https://chrome.google.com/webstore/detail/hyperchat-optimized-youtu/naipgebhooiiccifflecbffmnjbabdbh';
  const badges = [
    {
      name: 'Leave a review',
      src: 'https://img.shields.io/badge/Leave a review-5%20stars-blue?style=flat',
      href: reviewLink
    },
    {
      name: 'Star on GitHub',
      src: 'https://img.shields.io/github/stars/LiveTL/HyperChat?style=flat&logo=github&label=Star on GitHub',
      href: 'https://github.com/LiveTL/HyperChat/'
    },
    {
      name: 'Donators and supporters',
      src: 'https://img.shields.io/opencollective/all/livetl?color=blue&label=Donators%20and%20supporters&logo=dollar&style=flat',
      href: 'https://opencollective.com/livetl'
    },
    {
      name: 'Discord',
      src: 'https://img.shields.io/discord/780938154437640232.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2&style=flat',
      href: 'https://discord.gg/uJrV3tmthg'
    }
  ];
</script>

<Card.Card classes={c => c.concat(' bg-blue-900 text-white w-full')}>
  <div slot="text" class="p-2.5">
    <div class="mb-2 flex items-center">
      <div>
        <img class="rounded-full" width="44" height="44" src="{logo}" alt="logo">
      </div>
      <div class="font-bold text-xl pl-2.5">HyperChat by LiveTL</div>
    </div>
    <span>
      <i>It may take a few seconds for messages to start appearing.</i>
      <br/>
      <strong>HyperChat can reduce CPU usage by up to 80%!</strong>
    </span>
    <br/>
    <div class="mt-2 flex flex-wrap">
    {#each badges as { name, src, href }}
      <a {href} class="p-0.5">
        <img alt={name} {src} />
      </a>
    {/each}
    </div>
  </div>
</Card.Card>

<style>
</style>
