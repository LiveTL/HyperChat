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
