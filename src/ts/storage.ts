import { webExtStores } from 'svelte-webext-stores';

export const stores = webExtStores();

export const hcEnabled = stores.addSyncStore('hc.enabled', true);
