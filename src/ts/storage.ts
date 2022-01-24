import { webExtStores } from 'svelte-webext-stores';
import { readable, writable } from 'svelte/store';
import { getClient, IframeTranslatorClient } from 'iframe-translator';

export const stores = webExtStores();

export const hcEnabled = stores.addSyncStore('hc.enabled', true);
export const translateTargetLanguage = stores.addSyncStore('hc.translateTargetLanguage', '');
export const translatorClient = readable(null as (null | IframeTranslatorClient), (set) => {
  let client: IframeTranslatorClient | null = null;
  const destroyIf = (): void => {
    if (client !== null) {
      client.destroy();
    }
    set(null);
  };
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const unsub = translateTargetLanguage.subscribe(async ($translateTargetLanguage) => {
    if (!$translateTargetLanguage) {
      destroyIf();
      return;
    }
    if (client) return;
    client = await getClient();
    set(client);
  });
  return () => {
    unsub();
    destroyIf();
  };
});
export const refreshScroll = writable(false);
