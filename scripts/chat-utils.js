export const getFrameInfoAsync = async () => {
  return new Promise(
    (resolve, reject) =>
      chrome.runtime.sendMessage({ type: 'getFrameInfo' }, resolve)
  );
};

export const createPopup = (url) => {
  chrome.runtime.sendMessage({ type: 'createPopup', url });
};
