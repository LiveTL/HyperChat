export const isLiveTL = false;
export const isAndroid = false;
// DO NOT EDIT THE ABOVE LINE. It is updated by webpack.

export const getFrameInfoAsync = async (): Promise<Chat.UncheckedFrameInfo> => {
  return new Promise(
    (resolve) =>
      chrome.runtime.sendMessage({ type: 'getFrameInfo' }, resolve)
  );
};

export const createPopup = (url: string): void => {
  chrome.runtime.sendMessage({ type: 'createPopup', url });
};

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

/**
 * Type predicates
 */
/** Checks if renderer is a PaidMessageRenderer */
export const isPaidMessageRenderer = (actionItem: Ytc.AddChatItem, renderer: Ytc.Renderers): renderer is Ytc.PaidMessageRenderer => {
  const r = renderer as Ytc.PaidMessageRenderer;
  return actionItem.liveChatPaidMessageRenderer !== undefined && r.purchaseAmountText && (r.bodyBackgroundColor !== undefined);
};

/** Checks if frameInfo values are valid */
export const isValidFrameInfo = (f: Chat.UncheckedFrameInfo, port?: Chat.Port): f is Chat.FrameInfo => {
  const check = f.tabId != null && f.frameId != null;
  if (!check) {
    console.error('Invalid frame info', { port });
  }
  return check;
};

export const isFrameInfoMsg = (m: Chat.WindowMessage): m is Chat.FrameInfoMsg => {
  return m.type === 'frameInfo' && isValidFrameInfo(m.frameInfo);
};
