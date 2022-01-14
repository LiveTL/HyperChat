import { Language } from './enums';
import { webExtStores } from 'svelte-webext-stores';
import { writable } from 'svelte/store';

export const stores = webExtStores();

export const hcEnabled = stores.addSyncStore('hc.enabled', true);
export const translateTargetLanguage = stores.addSyncStore('hc.translateTargetLanguage', Language.English);
export const translateMessage = writable(undefined as undefined | GTL.TranslateRequest);
export const refreshScroll = writable(false);
