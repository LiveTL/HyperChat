import { Language } from './enums';
import { webExtStores } from 'svelte-webext-stores';
import { writable } from 'svelte/store';
import { queue } from './queue';

export const stores = webExtStores();

export const hcEnabled = stores.addSyncStore('hc.enabled', true);
export const translateTargetLanguage = stores.addSyncStore('hc.translateTargetLanguage', Language.English);
export const messageTranslationQueue = writable(queue<GTL.TranslateRequest>());
export const refreshScroll = writable(false);
