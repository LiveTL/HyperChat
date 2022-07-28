<script lang="ts">
  import Message from './Message.svelte';
  import MessageRun from './MessageRuns.svelte';
  import { showProfileIcons } from '../ts/storage';
  import { membershipBackground, milestoneChatBackground } from '../ts/chat-constants';
  import { mdiInformation } from '@mdi/js';

  export let message: Ytc.ParsedMessage;

  const classes = 'inline-flex flex-col rounded break-words overflow-hidden w-full text-white';

  $: membership = message.membership;
  $: membershipGift = message.membershipGiftPurchase;
  $: if (!(membership || membershipGift)) {
    console.error('Not a membership item', { message });
  }
  $: isMilestoneChat = message.message.length > 0;

  $: primaryText = (membership || membershipGift)?.headerPrimaryText;
  $: optInPrompt = {
    buttonRenderer: {
      style: 'STYLE_TEXT',
      size: 'SIZE_DEFAULT',
      isDisabled: false,
      text: {
        runs: [
          {
            text: 'Allow Gifts'
          }
        ]
      },
      icon: {
        iconType: 'GIFT'
      },
      trackingParams: 'CBsQ6P8IIhMInMjxqNCa-QIVwSqtBh17WA1Q',
      command: {
        clickTrackingParams: 'CBsQ6P8IIhMInMjxqNCa-QIVwSqtBh17WA1Q',
        commandMetadata: {
          webCommandMetadata: {
            sendPost: true,
            apiUrl: '/youtubei/v1/browse'
          }
        },
        browseEndpoint: {
          browseId: 'FEgifting_opt_in',
          params: 'igcaChhVQzNuNXVHdTE4Rm9DeTIzZ2dXV3A4dEE%3D',
          navigationType: 'BROWSE_NAVIGATION_TYPE_STAY_ON_PAGE'
        }
      }
    }
  };
  // membershipGift?.optInPrompt;
</script>

{#if membership || membershipGift}
  <div class={classes} style="background-color: #{membershipBackground};">
    <div
      class="p-2"
      style="{isMilestoneChat ? `background-color: #${milestoneChatBackground};` : ''}"
    >
      {#if $showProfileIcons}
        <img
          class="h-5 w-5 inline align-middle rounded-full flex-none mr-1"
          src={message.author.profileIcon.src}
          alt={message.author.profileIcon.alt}
        />
      {/if}
      <span class="font-bold tracking-wide align-middle mr-3">
        {message.author.name}
      </span>
      {#if primaryText && primaryText.length > 0}
        <MessageRun
          class="font-medium mr-3"
          runs={primaryText}
        />
      {/if}
      {#if membership}
        <MessageRun runs={membership.headerSubtext} />
      {/if}
      {#if membershipGift}
        <img
          class="h-10 w-10 float-right"
          src={membershipGift.image.src}
          alt={membershipGift.image.alt}
          title={membershipGift.image.alt} />
          {#if optInPrompt}
            <div class="w-full flex justify-center  cursor-pointer">
              <span class="rounded-full px-2 py-1" style="background-color: #{milestoneChatBackground};">
                <svg height="16" width="16" viewBox="0 0 24 24" class="inline-block">
                  <path d={mdiInformation} fill="white"/>
                </svg>
                <span class="text-white underline">
                  Opt into membership gift reception for this channel
                </span>
              </span>
            </div>
          {/if}
      {/if}
    </div>
    {#if isMilestoneChat}
      <div class="p-2">
        <Message message={message} hideName />
      </div>
    {/if}
  </div>
{/if}
