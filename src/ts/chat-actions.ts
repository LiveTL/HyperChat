import { ChatUserActions, chatUserActionsItems } from './chat-constants';

export async function useBanHammer(
  message: Ytc.ParsedMessage,
  action: ChatUserActions
): Promise<void> {
  return await new Promise((resolve, reject) => {
    if (message.author.url == null) {
      reject(new Error('No author url'));
      return;
    }
    const actionIndex = chatUserActionsItems.findIndex(
      (item) => item.value === action
    );
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.src = `${message.author.url}/about`;
    iframe.addEventListener('load', () => {
      if (iframe.contentDocument == null) {
        reject(new Error('No content document'));
        return;
      }
      const elements = iframe.contentDocument.querySelectorAll(
        '.tp-yt-iron-dropdown ytd-menu-service-item-renderer, ytd-toggle-menu-service-item-renderer'
      );
      const menuItem = elements[actionIndex] as HTMLButtonElement;
      menuItem.click();
      setTimeout(() => {
        const confirmButton = document.querySelector('#confirm-button') as HTMLButtonElement;
        confirmButton.click();
        setTimeout(resolve, 50);
      }, 50);
    });
  });
}
