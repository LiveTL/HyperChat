<script lang="ts">
  export let message: Ytc.ParsedMessage;
  export let deleted = false;

  const member = message.author.types.some((type) => type === 'member');
  const moderator = message.author.types.some((type) => type === 'moderator');
  const owner = message.author.types.some((type) => type === 'owner');
</script>

<div class="message" class:superchat={message.superchat}>
  {#if message.superchat}
    <strong>{message.superchat.amount}</strong>
  {/if}
  <strong
    class="
      {member ? 'text-member dark:text-member-dark' : ''}
      {moderator ? 'text-moderator dark:text-moderator-dark' : ''}
      {owner ? 'text-owner dark:text-owner-dark' : ''}
    "
  >
    {message.author.name}
  </strong>
  <span>
    {#each message.message as run}
      {#if run.type === 'text'}
        <span class="{deleted ? 'text-deleted dark:text-deleted-dark' : ''}">
          {run.text}
        </span>
      {:else if run.type === 'link'}
        <a href={run.url} target="_blank">{run.text}</a>
      {:else if run.type === 'emote' && run.src}
        <img class="emote" src={run.src} alt="emote" />
      {/if}
    {/each}
  </span>
</div>

<style>
  .message {
    transform-origin: 0 100%;
    overflow: hidden;
    padding: 6px;
    text-overflow: ellipsis;
  }

  .emote {
    vertical-align: sub;
    height: 1.5em;
    width: 1.5em;
    margin: 0px 0.2em 0px 0.2em;
  }
</style>
