import { AvailableLanguages, DefaultHost } from 'iframe-translator/constants';
import type { AvailableLanguageCodes, IframeTranslatorClient } from 'iframe-translator';

const makeID = (length: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const getSafeTranslatorClient = async (
  host: string = DefaultHost
): Promise<IframeTranslatorClient> => {
  return await new Promise((resolve) => {
    const iframe = document.querySelector<HTMLIFrameElement>('#iframe-translator') ?? document.createElement('iframe');
    iframe.src = host;
    iframe.id = 'iframe-translator';
    iframe.style.position = 'fixed';
    iframe.style.top = '0px';
    iframe.style.left = '0px';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.zIndex = '1000000000';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = 'none';
    iframe.style.filter = 'opacity(0)';
    iframe.style.touchAction = 'none';

    let callbacks: Record<string, (text: string) => void> = {};

    const translate = async (
      text: string,
      targetLanguage: AvailableLanguageCodes = 'en'
    ): Promise<string> => {
      const messageID = `iframe-translator-${makeID(69)}`;
      return await new Promise((resolveTranslate) => {
        callbacks[messageID] = resolveTranslate;
        iframe.contentWindow?.postMessage(JSON.stringify({
          messageID,
          type: 'request',
          targetLanguage: AvailableLanguages[targetLanguage],
          text
        }), '*');
      });
    };

    const onMessage = (event: MessageEvent): void => {
      try {
        const data = JSON.parse(event.data as string) as {
          messageID?: string;
          type?: string;
          text?: string;
        };
        if (data.type === 'loaded') {
          resolve({
            translate,
            destroy
          });
          return;
        }
        if (data.type === 'response' && data.messageID != null) {
          callbacks[data.messageID]?.(data.text ?? '');
          delete callbacks[data.messageID];
        }
      } catch (error) {
      }
    };

    const destroy = (): void => {
      document.body.removeChild(iframe);
      callbacks = {};
      window.removeEventListener('message', onMessage);
    };

    window.addEventListener('message', onMessage);
    document.body.appendChild(iframe);
  });
};
