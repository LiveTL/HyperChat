import { webExtStores } from 'svelte-webext-stores';
import { Theme } from './chat-constants';

export const stores = webExtStores();

export const hcEnabled = stores.addSyncStore('hc.enabled', true);
export const theme = stores.addSyncStore('hc.theme', Theme.YOUTUBE);

export const showProfileIcons = stores.addSyncStore('hc.messages.showProfileIcons', false);
export const showUsernames = stores.addSyncStore('hc.messages.showUsernames', true);
export const showTimestamps = stores.addSyncStore('hc.messages.showTimestamps', false);
export const showUserBadge = stores.addSyncStore('hc.messages.showUserBadge', true);
