import type { ChatUserActions } from './chat-constants';

export function useBanHammer(
  message: Ytc.ParsedMessage,
  action: ChatUserActions,
  port: Chat.Port | null
): void {
  port?.postMessage({
    type: 'executeChatAction',
    message,
    action
  });
}
