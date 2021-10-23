export const isLiveTL = false;
export const isAndroid = false;
// DO NOT EDIT THE ABOVE LINE. It is updated by webpack.

export enum Browser {
  FIREFOX,
  CHROME,
  SAFARI,
  ANDROID
}

export const BROWSER = (() => {
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
})();

const params = new URLSearchParams(window.location.search);
export const paramsTabId = params.get('tabid');
export const paramsFrameId = params.get('frameid');
export const paramsIsReplay = params.get('isReplay');
