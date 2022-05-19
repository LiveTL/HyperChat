import { writable } from 'svelte/store';
import { ChatReportUserOptions, ChatUserActions } from './chat-constants';
import { reportDialog } from './storage';

export function useBanHammer(
  message: Ytc.ParsedMessage,
  action: ChatUserActions,
  port: Chat.Port | null
): void {
  if (action === ChatUserActions.BLOCK) {
    port?.postMessage({
      type: 'executeChatAction',
      message,
      action
    });
  } else if (action === ChatUserActions.REPORT_USER) {
    const store = writable(null as null | ChatReportUserOptions);
    reportDialog.set({
      callback: (selection) => {
        port?.postMessage({
          type: 'executeChatAction',
          message,
          action,
          reportOption: selection
        });
      },
      optionStore: store
    });
  }
}
