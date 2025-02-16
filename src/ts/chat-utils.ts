import type { Chat } from './typings/chat';

export const getFrameInfoAsync = async (): Promise<Chat.UncheckedFrameInfo> => {
  return await new Promise(
    (resolve) =>
      chrome.runtime.sendMessage({ type: 'getFrameInfo' }, resolve)
  );
};

export const createPopup = (url: string): void => {
  chrome.runtime.sendMessage({ type: 'createPopup', url });
};

export const frameIsReplay = (): boolean => {
  try {
    return window.location.href.startsWith(
      `${(location.protocol + '//' + location.host)}/live_chat_replay`
    );
  } catch (e) {
    return false;
  }
};

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

const actionTypes = new Set(['messages', 'bonk', 'delete', 'pin', 'unpin', 'summary', 'poll', 'redirect', 'playerProgress', 'forceUpdate']);
export const responseIsAction = (r: Chat.BackgroundResponse): r is Chat.Actions =>
  actionTypes.has(r.type);

export const isMembershipGiftPurchaseRenderer = (r: Ytc.Renderers): r is Ytc.MembershipGiftPurchaseRenderer =>
  'header' in r && 'liveChatSponsorshipsHeaderRenderer' in r.header;

const privilegedTypes = new Set(['member', 'moderator', 'owner']);
export const isPrivileged = (types: string[]): boolean =>
  types.some(privilegedTypes.has.bind(privilegedTypes));

export const isChatMessage = (a: Chat.MessageAction): boolean =>
  !a.message.superChat && !a.message.superSticker && !a.message.membership;

export const isAllEmoji = (a: Chat.MessageAction): boolean =>
  a.message.message.length !== 0 &&
  a.message.message.every(m => m.type === 'emoji' || (m.type === 'text' && m.text.trim() === ''));

export const checkInjected = (error: string): boolean => {
  if (document.querySelector('#hc-buttons')) {
    console.error(error);
    return true;
  }
  return false;
};

export const useReconnect = <T extends Chat.Port>(connect: () => T): T & { destroy: () => void } => {
  let actualPort = connect();
  const onDisconnect = (): void => {
    actualPort = connect();
    actualPort.onDisconnect.addListener(onDisconnect);
  };
  actualPort.onDisconnect.addListener(onDisconnect);

  return {
    ...actualPort,
    get name() { return actualPort.name; },
    disconnect(...args) { return actualPort.disconnect(...args); },
    postMessage(...args) { return actualPort.postMessage(...args); },
    get onMessage() { return actualPort.onMessage; },
    get onDisconnect() { return actualPort.onDisconnect; },
    destroy: () => {
      actualPort.onDisconnect.removeListener(onDisconnect);
      actualPort.disconnect();
    }
  };
};
