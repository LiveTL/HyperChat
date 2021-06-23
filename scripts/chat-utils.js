export const getFrameInfoAsync = async () => {
  return new Promise(
    (resolve, reject) =>
      chrome.runtime.sendMessage({ type: 'getFrameInfo' }, resolve)
  );
};
