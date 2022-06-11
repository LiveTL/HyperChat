<script lang="ts">
  import Message from './Message.svelte';
  import isDarkColor from 'is-dark-color';
  import { Theme } from '../ts/chat-constants';
  import { focusedSuperchat, showProfileIcons } from '../ts/storage';

  export let message: Ytc.ParsedTimedItem;
  export let chip = false;
  export let fillPortion = 1;

  let headerStyle = '';

  $: paid = message.superChat ?? message.superSticker;
  $: amount = paid?.amount;
  $: backgroundColor = `background-color: #${paid?.bodyBackgroundColor};`;
  $: textColor = `color: #${paid?.bodyTextColor};`;
  $: nameColor = `color: #${paid?.nameColor};`;
  $: if (message.superChat) {
    const background = message.superChat.headerBackgroundColor;
    const text = message.superChat.headerTextColor;
    headerStyle = `background-color: #${background}; color: #${text};`;
  } else {
    headerStyle = '';
  }

  const classes = `inline-flex flex-col rounded ${chip ? 'w-fit whitespace-nowrap' : 'w-full break-words'}`;

  $: if (!paid) {
    console.error('Not a paid message', { message });
  }
</script>

{#if paid}
  <div class={classes} style={(chip ? '' : backgroundColor) + textColor}>
    <div
      class="relative {chip ? 'rounded-full items-center flex cursor-pointer w-max p-1.5 overflow-hidden' : 'rounded p-2'}"
      style={headerStyle}
      on:click={() => {
        if (chip) $focusedSuperchat = message;
      }}
    >
      {#if $showProfileIcons}
        <img
          class="h-5 w-5 inline align-middle rounded-full flex-none mr-1"
          src={message.author.profileIcon.src}
          alt={message.author.profileIcon.alt}
        />
      {/if}
      {#if chip}
        <div class="absolute top-0 right-0 h-full" style="
          background-color: rgba(0, 0, 0, 0.1);
          width: {Math.round(fillPortion * 100)}%;
        " />
      {/if}
      <span class="underline font-bold align-middle">{amount}</span>
      {#if !chip}
        <span class="font-bold tracking-wide" style={nameColor}>
          {message.author.name}
        </span>
      {/if}
      {#if message.superSticker}
        <img
          class="h-10 w-10 float-right"
          src={message.superSticker.src}
          alt={message.superSticker.alt} />
      {/if}
    </div>
    {#if !chip && message.message.length > 0}
      <div class="p-2">
        <Message message={message} hideName forceTLColor={
          isDarkColor(`#${message.superChat?.headerTextColor}`) ? Theme.LIGHT : Theme.DARK
        } />
      </div>
    {/if}
  </div>
{/if}
