<script lang="ts">
  import Message from './Message.svelte';

  export let message: Ytc.ParsedMessage;

  $: membership = message.membership;
  $: m = message.superChat || message.superSticker;
  $: amount = m?.amount;
  $: backgroundColor = `background-color: ${membership ? 'var(--color-member-dark)' : '#' + m?.backgroundColor};`;
  $: textColor = `color: ${membership ? 'var(--color-white)' : '#' + m?.textColor};`;
  $: nameColor = `${membership ? '' : 'color: #' + m?.nameColor};`;

  const classes = 'p-2 inline-flex flex-col rounded break-words overflow-hidden w-full';

  $: valid = membership || m;
  $: if (!valid) {
    console.error('Not a paid message', { message });
  }
</script>

{#if valid}
  <div class="{classes}" style="{backgroundColor + textColor}">
    <div>
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
      <div class="mt-2">
        <Message message={message} hideName={true} />
      </div>
    {/if}
  </div>
{/if}
