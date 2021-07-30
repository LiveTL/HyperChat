export const getFrameInfoAsync = async (): Promise<Chat.UncheckedFrameInfo> => {
  return new Promise(
    (resolve) =>
      chrome.runtime.sendMessage({ type: 'getFrameInfo' }, resolve)
  );
};

export const createPopup = (url: string): void => {
  chrome.runtime.sendMessage({ type: 'createPopup', url });
};
