<script lang="ts">
  import { lastClosedVersion, refreshScroll, focusedSuperchat } from '../ts/storage';
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
  const kiaraBday = (/* true || */ (d.getFullYear() === 2022 && d.getMonth() === 6 && d.getDate() >= 5 /* && d.getDate() <= 8 */));
  // ^^^^^^^ start showing 2 days before, and don't hide
  const getURL = (asset: string) => chrome.runtime.getURL((isLiveTL ? 'hyperchat' : 'assets') + `/${asset}`);
</script>

<div class={classes}>
  <div class="flex items-center w-full">
    <div class="relative">
      <img class="rounded-full" width="44" height="44" src={logo} alt="logo">
      {#if kiaraBday}
        <img src={getURL('kiara-hat.png')} class="kiwawa-hat cursor-pointer" alt="Takanashi Kiara's Birthday Surprise" on:click={() => {
          $focusedSuperchat = {
            author: {
              name: 'Kento Nishi | LiveTL & HyperChat Dev🐔',
              id: 'fake-user-id',
              types: [],
              profileIcon: {
                src: getURL('kento.png'),
                alt: 'Kento Nishi'
              }
            },
            message: [{
              type: 'text',
              text: 'Happy Birthday, Kiwawa!'
            }, {
              type: 'emoji',
              alt: 'KiaraLove',
              src: getURL('kiara-love.png')
            }, {
              type: 'newline'
            }, {
              type: 'text',
              text: 'ここで、ドイツ語で「お誕生日おめでとう」を歌わせていただきます、、、なんちゃってｗｗｗ'
            }, {
              type: 'newline'
            }, {
              type: 'text',
              text: `
                I just wanted to take this special occasion to express my gratitude
                to you and the KFP community for... well, existing, really.
                I've been a part of many fandoms, but KFP feels special;
                your engagement in the community is unlike that of any other
                content creator. I love that you are so close with us employees,
                be it through the chat, conventions like Dokomi, or even memes on Twitter.
              `
            }, {
              type: 'newline'
            }, {
              type: 'text',
              text: `
                When I started developing LiveTL and HyperChat, I never imagined
                that my oshi would one day be a user, and a very supportive one
                at that! There's been a very obvious uptick in new features and improvements
                to HyperChat since you started using it -- you are an inspiration to me,
                and you motivate all of us developers to keep pushing to provide completely
                free and open-source software for everyone to enjoy.
              `
            }, {
              type: 'newline'
            }, {
              type: 'text',
              text: `
                Aside from all that sentimental stuff, I really enjoy your streams, music, art,
                and memes! Your streams are a blast, and I wish I could watch them live more
                often (curse you, timezones!). Keep 'em comin'!
              `
            }, {
              type: 'newline'
            }, {
              type: 'text',
              text: `
                Again, happy birthday, tenchou! Here's to another year of Kiwawa and KFP!
                VIVA LA KFP! VIVA LA KIARA!
              `
            }, {
              type: 'emoji',
              alt: 'KiaraKotori',
              src: getURL('kiara-kotori.png')
            }],
            timestamp: 'July 6th, 2022',
            showtime: 69420,
            messageId: 'fake-message-id',
            superChat: {
              headerBackgroundColor: 'ff883a',
              headerTextColor: 'ffffff',
              amount: '',
              bodyBackgroundColor: 'ffb700',
              bodyTextColor: '000000',
              nameColor: '000000'
            }
          };
        }}>
      {/if}
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
        <Icon xs class="text-error-500 dark:text-error-200 font-bold">
          close
        </Icon>
      </span>
      <span class="mr-0.5">
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
