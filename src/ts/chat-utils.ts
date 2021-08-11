export const getFrameInfoAsync = async (): Promise<Chat.UncheckedFrameInfo> => {
  return new Promise(
    (resolve) =>
      chrome.runtime.sendMessage({ type: 'getFrameInfo' }, resolve)
  );
};

export const createPopup = (url: string): void => {
  chrome.runtime.sendMessage({ type: 'createPopup', url });
};

/*
 * Type predicates
 */
export const isPaidMessageRenderer = (actionItem: Ytc.AddChatItem, renderer: Ytc.Renderers): renderer is Ytc.PaidMessageRenderer => {
  const r = renderer as Ytc.PaidMessageRenderer;
  return !!(actionItem.liveChatPaidMessageRenderer) && r.purchaseAmountText && (r.bodyBackgroundColor != null);
};

export const isPaidStickerRenderer = (actionItem: Ytc.AddChatItem, renderer: Ytc.Renderers): renderer is Ytc.PaidStickerRenderer => {
  const r = renderer as Ytc.PaidStickerRenderer;
  return !!(actionItem.liveChatPaidStickerRenderer) && r.purchaseAmountText && (r.moneyChipBackgroundColor != null);
};

export const isMembershipRenderer = (actionItem: Ytc.AddChatItem, renderer: Ytc.Renderers): renderer is Ytc.MembershipRenderer => {
  const r = renderer as Ytc.MembershipRenderer;
  return !!(actionItem.liveChatMembershipItemRenderer) && !!(r.headerSubtext);
};

/** Checks if frameInfo values are valid */
export const isValidFrameInfo = (f: Chat.UncheckedFrameInfo, port?: Chat.Port): f is Chat.FrameInfo => {
  const check = f.tabId != null && f.frameId != null;
  if (!check) {
    console.error('Invalid frame info', { port });
  }
  return check;
};

export const isParsedMessage = (a: Ytc.ParsedAction): a is Ytc.ParsedMessage => {
  const m = (a as Ytc.ParsedMessage);
  return !!(m.author) && !!(m.message) && !!(m.messageId);
};

export const isParsedBonk = (a: Ytc.ParsedAction): a is Ytc.ParsedBonk => {
  const b = (a as Ytc.ParsedBonk);
  return !!(b.replacedMessage) && !!(b.authorId);
};

export const isParsedDelete = (a: Ytc.ParsedAction): a is Ytc.ParsedDeleted => {
  const b = (a as Ytc.ParsedDeleted);
  return !!(b.replacedMessage) && !!(b.messageId);
};
