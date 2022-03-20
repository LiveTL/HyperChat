import { webExtStores } from 'svelte-webext-stores';
import { readable, writable, get } from 'svelte/store';
import { getClient, AvailableLanguages } from 'iframe-translator';
import type { IframeTranslatorClient, AvailableLanguageCodes } from 'iframe-translator';
import { Theme, YoutubeEmojiRenderMode } from './chat-constants';

export const stores = webExtStores();

export const hcEnabled = stores.addSyncStore('hc.enabled', true);
export const translateTargetLanguage = stores.addSyncStore('hc.translateTargetLanguage', '' as '' | AvailableLanguageCodes);
export const translatorClient = readable(null as (null | IframeTranslatorClient), (set) => {
  let client: IframeTranslatorClient | null = null;
  const destroyIf = (): void => {
    if (client !== null) {
      client.destroy();
      client = null;
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
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  translateTargetLanguage.ready().then(() => {
    // migrate from old language value to new language code
    const oldString = get(translateTargetLanguage) as string;
    if (!(oldString in AvailableLanguages)) {
      const newKey = (
        Object.keys(AvailableLanguages) as AvailableLanguageCodes[]
      ).find(key => AvailableLanguages[key] === oldString);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      translateTargetLanguage.set(newKey ?? '');
    }
  });
  return () => {
    unsub();
    destroyIf();
  };
});
export const refreshScroll = writable(false);
export const theme = stores.addSyncStore('hc.theme', Theme.YOUTUBE);
export const showProfileIcons = stores.addSyncStore('hc.messages.showProfileIcons', false);
export const showUsernames = stores.addSyncStore('hc.messages.showUsernames', true);
export const showTimestamps = stores.addSyncStore('hc.messages.showTimestamps', false);
export const showUserBadges = stores.addSyncStore('hc.messages.showUserBadges', true);
export const lastClosedVersion = stores.addSyncStore('hc.lastClosedVersion', '');
export const showOnlyMemberChat = stores.addSyncStore('hc.showOnlyMemberChat', false);
export const emojiRenderMode = stores.addSyncStore('hc.emojiRenderMode', YoutubeEmojiRenderMode.SHOW_ALL);
