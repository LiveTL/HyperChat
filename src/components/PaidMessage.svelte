<script lang="ts">
  import Message from './Message.svelte';

  export let message: Ytc.ParsedMessage;

  let headerStyle = '';

  $: membership = message.membership;
  $: m = message.superChat || message.superSticker;
  $: amount = m?.amount;
  $: backgroundColor = `background-color: ${membership ? '#0f9d58' : '#' + m?.bodyBackgroundColor};`;
  $: textColor = `color: ${membership ? 'var(--color-white)' : '#' + m?.bodyTextColor};`;
  $: nameColor = `${membership ? '' : 'color: #' + m?.nameColor};`;
  $: if (message.superChat) {
    const background = message.superChat.headerBackgroundColor;
    const text = message.superChat.headerTextColor;
    headerStyle = `background-color: #${background}; color: #${text}`;
  } else {
    headerStyle = '';
  }

  const classes = 'inline-flex flex-col rounded break-words overflow-hidden w-full';

  $: valid = membership || m;
  $: if (!valid) {
    console.error('Not a paid message', { message });
  }
</script>

{#if valid}
  <div class="{classes}" style="{backgroundColor + textColor}">
    <div class="p-2" style="{headerStyle}">
      {#if !membership}
        <span class="mr-1 underline font-bold">{amount}</span>
      {/if}
      <span class="font-bold tracking-wide" style="{nameColor}">
        {message.author.name}
      </span>
      {#if message.superSticker}
        <img
          class="h-10 w-10 float-right"
          src={message.superSticker.src}
          alt="super-sticker" />
      {/if}
    </div>
    {#if message.message.length > 0}
      <div class="p-2">
        <Message message={message} hideName={true} />
      </div>
    {/if}
  </div>
{/if}
