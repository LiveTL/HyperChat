<script lang="ts">
  import { isLiveTL } from '../../ts/chat-constants';
  const trailer = chrome.runtime.getURL(
    (isLiveTL ? 'hyperchat' : 'assets') + '/trailer.png'
  );
</script>

<ul class="list-disc list-inside">
  <strong>On today's KFP menu:</strong>
  <div style="width: 100%; display: flex; justify-content: center; margin: 8px 0px;">
    <a href="https://www.youtube.com/watch?v=FU3YWQy_Rfs" target="_blank">
      <img src={trailer} style="width: 150px; aspect-ratio: calc(16 / 9);" alt="HyperChat Trailer" class="rounded-sm" />
    </a>
  </div>
</ul>
<ul class="list-disc list-inside">
  <strong>What's still cooking in the usual room:</strong>
  <li class="ml-3.5">
    Migration to Manifest V3
  </li>
</ul>
