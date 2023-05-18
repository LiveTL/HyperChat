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
  BLOCK = 'BLOCK',
  REPORT_USER = 'REPORT_USER',
}

export enum ChatReportUserOptions {
  UNWANTED_SPAM = 'UNWANTED_SPAM',
  PORN_OR_SEX = 'PORN_OR_SEX',
  CHILD_ABUSE = 'CHILD_ABUSE',
  HATE_SPEECH = 'HATE_SPEECH',
  TERRORISM = 'TERRORISM',
  HARASSMENT = 'HARASSMENT',
  SUICIDE = 'SUICIDE',
  MISINFORMATION = 'MISINFORMATION',
}

export const chatReportUserOptions = [
  { value: ChatReportUserOptions.UNWANTED_SPAM, label: 'Unwanted commercial content or spam' },
  { value: ChatReportUserOptions.PORN_OR_SEX, label: 'Pornography or sexually explicit material' },
  { value: ChatReportUserOptions.CHILD_ABUSE, label: 'Child abuse' },
  { value: ChatReportUserOptions.HATE_SPEECH, label: 'Hate speech or graphic violence' },
  { value: ChatReportUserOptions.TERRORISM, label: 'Promotes terrorism' },
  { value: ChatReportUserOptions.HARASSMENT, label: 'Harassment or bullying' },
  { value: ChatReportUserOptions.SUICIDE, label: 'Suicide or self injury' },
  { value: ChatReportUserOptions.MISINFORMATION, label: 'Misinformation' }
];

export const chatUserActionsItems = [
  {
    value: ChatUserActions.BLOCK,
    text: 'Block user',
    icon: 'block',
    messages: {
      success: 'The user has been blocked, and you will no longer see their messages. It may take several minutes for the setting to take full effect. You can unblock users in the settings panel at any time.',
      error: 'There was an error blocking the user. It is possible that this user has already been blocked. If not, please try again later.'
    }
  },
  {
    value: ChatUserActions.REPORT_USER,
    text: 'Report user',
    icon: 'flag',
    messages: {
      success: 'The user has been reported for review by YouTube staff.',
      error: 'There was an error reporting the user. Please try again later.'
    }
  }
];

export const membershipBackground = '0f9d58';
export const milestoneChatBackground = '107516';
export const currentDomain = location.protocol.includes('youtube') ? (location.protocol + '//' + location.host) : 'https://www.youtube.com';
