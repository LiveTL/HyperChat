export const isLiveTL = false;
export const isAndroid = false;
// DO NOT EDIT THE ABOVE LINE. It is updated by webpack.

export const enum Browser {
  FIREFOX,
  CHROME,
  SAFARI,
  ANDROID
}

export const getBrowser = (): Browser => {
  if (navigator.userAgent.includes('Firefox')) {
    return Browser.FIREFOX;
  }
  if (isAndroid || window.chrome == null) {
    return Browser.ANDROID;
  }
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    return Browser.SAFARI;
  }
  return Browser.CHROME;
};

const params = new URLSearchParams(window.location.search);
export const paramsTabId = params.get('tabid');
export const paramsFrameId = params.get('frameid');
export const paramsIsReplay = params.get('isReplay');

export const enum Theme {
  YOUTUBE = 'YOUTUBE',
  LIGHT = 'LIGHT',
  DARK = 'DARK'
}

export const themeItems = [
  { value: Theme.YOUTUBE, label: 'Use YouTube theme' },
  { value: Theme.LIGHT, label: 'Light theme' },
  { value: Theme.DARK, label: 'Dark theme' }
];

export enum YoutubeEmojiRenderMode {
  SHOW_ALL = 'SHOW_ALL',
  BLOCK_SPAM = 'BLOCK_SPAM',
  HIDE_ALL = 'HIDE_ALL'
}

export const emojiRenderItems = [
  { value: YoutubeEmojiRenderMode.SHOW_ALL, label: 'Show all emojis' },
  { value: YoutubeEmojiRenderMode.BLOCK_SPAM, label: 'Hide emoji-only messages' },
  { value: YoutubeEmojiRenderMode.HIDE_ALL, label: 'Hide all emojis and emoji-only messages' }
];

export enum ChatUserActions {
  BLOCK = 0,
  // 1: report channel art
  REPORT_PFP = 2,
  REPORT_USER = 3,
}

export const chatUserActionsItems = [
  { value: ChatUserActions.BLOCK, text: 'Block user', icon: 'block' },
  { value: ChatUserActions.REPORT_PFP, text: 'Report profile picture', icon: 'flag_circle' },
  { value: ChatUserActions.REPORT_USER, text: 'Report user', icon: 'flag' }
];
