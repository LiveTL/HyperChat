import { Language } from './enums';
import { webExtStores } from 'svelte-webext-stores';
import { get, readable, writable } from 'svelte/store';
import { getClient, IframeTranslatorClient } from 'iframe-translator';

export const stores = webExtStores();

export const hcEnabled = stores.addSyncStore('hc.enabled', true);
export const translateTargetLanguage = stores.addSyncStore('hc.translateTargetLanguage', Language.English);
export const translatorClient = readable(null as (null | IframeTranslatorClient), (set) => {
  return translateTargetLanguage.subscribe(($translateTargetLanguage) => {
    if ($translateTargetLanguage === Language.None) {
      const val = get(translatorClient);
      if (val !== null) {
        val.destroy();
      }
      set(null);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getClient().then(set);
  });
});
export const refreshScroll = writable(false);
