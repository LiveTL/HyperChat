<script lang="ts">
  import { commentTranslateTargetLang, googleTranslateLoaded } from '../ts/storage';
  import { isLiveTL } from '../ts/chat-constants';
  export let id: string;
  export let text: string;
  
  $: computedID = `translation-${id.slice(0, -3)}`;

  $: if ($googleTranslateLoaded) {
    new (window as any).google.translate.TranslateElement({
      pageLanguage: 'jp'
    }, computedID);
  }
</script>

<span id={computedID}>
  {text}
</span>
