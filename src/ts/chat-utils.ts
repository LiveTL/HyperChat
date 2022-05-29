export const getFrameInfoAsync = async (): Promise<Chat.UncheckedFrameInfo> => {
  return await new Promise(
    (resolve) =>
      chrome.runtime.sendMessage({ type: 'getFrameInfo' }, resolve)
  );
};

export const createPopup = (url: string): void => {
  chrome.runtime.sendMessage({ type: 'createPopup', url });
};

export const frameIsReplay = window.location.href.startsWith(
  'https://www.youtube.com/live_chat_replay'
);

/*
 * Type predicates
 */
export const isPaidMessageRenderer =
  (r: Ytc.Renderers): r is Ytc.PaidMessageRenderer =>
    'purchaseAmountText' in r && 'bodyBackgroundColor' in r;

export const isPaidStickerRenderer =
  (r: Ytc.Renderers): r is Ytc.PaidStickerRenderer =>
    'purchaseAmountText' in r && 'moneyChipBackgroundColor' in r;

export const isMembershipRenderer =
  (r: Ytc.Renderers): r is Ytc.MembershipRenderer => 'headerSubtext' in r;

/** Checks if frameInfo values are valid */
export const isValidFrameInfo = (f: Chat.UncheckedFrameInfo, port?: Chat.Port): f is Chat.FrameInfo => {
  const check = f.tabId != null && f.frameId != null;
  if (!check) {
    console.error('Invalid frame info', { port });
  }
  return check;
};

const actionTypes = new Set(['messages', 'bonk', 'delete', 'pin', 'unpin', 'playerProgress', 'forceUpdate', 'ticker']);
export const responseIsAction = (r: Chat.BackgroundResponse): r is Chat.Actions =>
  actionTypes.has(r.type);

const privilegedTypes = new Set(['member', 'moderator', 'owner']);
export const isPrivileged = (types: string[]): boolean =>
  types.some(privilegedTypes.has.bind(privilegedTypes));

export const isChatMessage = (a: Chat.MessageAction): boolean =>
  !a.message.superChat && !a.message.superSticker && !a.message.membership;

export const isAllEmoji = (a: Chat.MessageAction): boolean =>
  a.message.message.every(m => m.type === 'emoji' || (m.type === 'text' && m.text.trim() === ''));

export const checkInjected = (error: string): boolean => {
  if (document.querySelector('#hc-buttons')) {
    console.error(error);
    return true;
  }
  return false;
};
