<script lang="ts">
  import Message from './Message.svelte';

  export let message: Ytc.ParsedMessage;

  const m = message.superChat || message.superSticker;
  const amount = m?.amount;
  const backgroundColor = m?.backgroundColor;
  const textColor = m?.textColor;
  const nameColor = m?.nameColor;

  const classes = 'p-2.5 inline-flex flex-col rounded break-words overflow-hidden w-full';
  const style = `background-color: #${backgroundColor}; color: #${textColor}`;
  const nameStyle = `color: #${nameColor}`;

  const valid = amount && backgroundColor && textColor && nameColor;
  if (!valid) {
    console.error('Not a paid message', { message });
  }
</script>

{#if valid}
  <div class="{classes}" style="{style}">
    <div>
      <span class="mr-1 underline font-bold">{amount}</span>
      <span class="font-bold tracking-wide" style="{nameStyle}">
        {message.author.name}
      </span>
      {#if message.superSticker}
        <img
          class="h-10 w-10 float-right"
          src={message.superSticker.src}
          alt="super-sticker" />
      {/if}
    </div>
    {#if message.superChat && message.message.length > 0}
      <div class="mt-2">
        <Message message={message} hideName={true} />
      </div>
    {/if}
  </div>
{/if}
