<script lang="ts">
  import Message from './Message.svelte';

  export let message: Ytc.ParsedMessage;

  let headerStyle = '';

  $: paid = message.superChat || message.superSticker;
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

  const classes = 'inline-flex flex-col rounded break-words overflow-hidden w-full';

  $: if (!paid) {
    console.error('Not a paid message', { message });
  }
</script>

{#if paid}
  <div class={classes} style={backgroundColor + textColor}>
    <div class="p-2" style={headerStyle}>
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
    {#if message.message.length > 0}
      <div class="p-2">
        <Message message={message} hideName />
      </div>
    {/if}
  </div>
{/if}
