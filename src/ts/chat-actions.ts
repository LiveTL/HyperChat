import { writable } from 'svelte/store';
import { ChatReportUserOptions, ChatUserActions, ChatPollActions } from './chat-constants';
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

/**
 * Ends a poll that is currently active in the live chat
 * @param poll The ParsedPoll object containing information about the poll to end
 * @param port The port to communicate with the background script
 */
export function endPoll(
  poll: Ytc.ParsedPoll,
  port: Chat.Port | null
): void {
  if (!port) return;
  
  // Use a dedicated executePollAction message type for poll operations
  port?.postMessage({
    type: 'executePollAction',
    poll,
    action: ChatPollActions.END_POLL
  });
}
