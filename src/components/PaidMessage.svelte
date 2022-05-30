<script lang="ts">
  import Message from './Message.svelte';
  import isDarkColor from 'is-dark-color';
  import { Theme } from '../ts/chat-constants';

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
    headerStyle = `background-color: #${background}; color: #${text}`;
  } else {
    headerStyle = '';
  }

  const classes = `inline-flex flex-col rounded overflow-hidden ${chip ? 'w-fit whitespace-pre' : 'w-full break-words'}`;

  $: if (!paid) {
    console.error('Not a paid message', { message });
  }
</script>

{#if paid}
  <div class={classes} style={(chip ? '' : backgroundColor) + textColor}>
    <div class="p-2 {chip ? 'rounded-full cursor-pointer' : ''}" style={headerStyle}>
      <span class="mr-1 underline font-bold">{amount}</span>
      <span class="font-bold tracking-wide" style={nameColor}>
        {message.author.name}
      </span>
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
