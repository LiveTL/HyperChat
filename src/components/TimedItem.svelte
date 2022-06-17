<script lang="ts">
  import PaidMessage from './PaidMessage.svelte';
  import MembershipItem from './MembershipItem.svelte';

  export let item: Ytc.ParsedTimedItem;
  export let fillPortion = 1;
  export let chip = false;

  $: detailText = 'detailText' in item ? item.detailText : '';
</script>

{#if ('superChat' in item || 'superSticker' in item)}
  <PaidMessage
    message={item}
    {chip}
    {fillPortion}
  />
{:else}
  <MembershipItem
    message={item}
    {chip}
    {fillPortion}
    {detailText}
  />
{/if}
