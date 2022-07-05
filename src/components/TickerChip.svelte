<script lang="ts">
  import { focusedSuperchat, showProfileIcons } from '../ts/storage';
  import { membershipBackground, milestoneChatBackground } from '../ts/chat-constants';
  import Icon from './common/Icon.svelte';

  export let item: Ytc.ParsedTicker;
  export let fillPortion = 1;

  let backgroundColor = '';
  $: if (item.membership && item.message.length > 0) {
    backgroundColor = milestoneChatBackground;
  } else if (item.membership || item.membershipGiftPurchase) {
    backgroundColor = membershipBackground;
  } else if (item.superChat) {
    backgroundColor = item.superChat.bodyBackgroundColor;
  }

  const classes = 'h-8 mx-0.5 relative rounded-full flex flex-none items-center cursor-pointer p-1.5 text-white overflow-hidden whitespace-nowrap';
</script>

<div
  class="{classes} {$$props.class ?? ''}"
  style="background-color: #{backgroundColor}; {$$props.style ?? ''}"
  on:click={() => ($focusedSuperchat = item)}
>
  {#if $showProfileIcons}
    <img
      class="h-5 w-5 inline align-middle rounded-full flex-none mr-1"
      src={item.author.profileIcon.src}
      alt={item.author.profileIcon.alt}
    />
  {/if}
  <div class="absolute top-0 right-0 h-full" style="
    background-color: rgba(0, 0, 0, 0.1);
    width: {Math.round(fillPortion * 100)}%;
  " />
  {#if item.membershipGiftPurchase}
    <Icon class="inline align-middle mr-1" small>redeem</Icon>
  {/if}
  <span
    class="font-bold align-middle {item.superChat ? 'underline' : ''}"
    style={item.superChat ? `color: #${item.superChat?.bodyTextColor}` : ''}
  >
    {item.detailText ?? item.superChat?.amount}
  </span>
</div>
