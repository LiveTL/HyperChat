import { webExtStores } from 'svelte-webext-stores';
import { writable } from 'svelte/store';
import { Language } from './typings/enums';

export const stores = webExtStores();

export const hcEnabled = stores.addSyncStore('hc.enabled', true);

export const commentTranslateTargetLang = stores.addSyncStore('hc.commentTranslateTargetLang', Language.English);
export const googleTranslateLoaded = writable(false);
