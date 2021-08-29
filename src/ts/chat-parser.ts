import {
  isPaidMessageRenderer,
  isPaidStickerRenderer,
  isMembershipRenderer,
  isParsedMessage,
  isParsedBonk,
  isParsedDelete
} from './chat-utils';

/** Whether the current chunk has been checked for delays. */
let checkedChunkDelay = false;
/** Amount of extra delay potentially to be added to the next chunk. */
let nextChunkDelay = 0;

const formatTimestamp = (timestampUsec: number): string => {
  return (new Date(timestampUsec / 1000)).toLocaleTimeString('en-GB');
};

const colorToHex = (color: number): string => color.toString(16).slice(-6);

const fixUrl = (url: string): string => {
  if (url.startsWith('//')) {
    return 'https:' + url;
  } else if (url.startsWith('/')) {
    return 'https://www.youtube.com' + url;
  } else {
    return url;
  }
};

const parseMessageRuns = (runs?: Ytc.MessageRun[]): Ytc.ParsedRun[] => {
  const parsedRuns: Ytc.ParsedRun[] = [];
  if (!runs) {
    return parsedRuns;
  }
  runs.forEach((run) => {
    if (run.text != null && run.navigationEndpoint) {
      parsedRuns.push({
        type: 'link',
        text: decodeURIComponent(escape(unescape(encodeURIComponent(
          run.text
        )))),
        url: fixUrl(run.navigationEndpoint.commandMetadata.webCommandMetadata.url)
      });
    } else if (run.text != null) {
      parsedRuns.push({
        type: 'text',
        text: decodeURIComponent(escape(unescape(encodeURIComponent(
          run.text
        ))))
      });
    } else if (run.emoji) {
      parsedRuns.push({
        type: 'emoji',
        src: fixUrl(run.emoji.image.thumbnails[0].url),
        alt: run.emoji.image.accessibility?.accessibilityData.label
      });
    }
  });
  return parsedRuns;
};

const parseAddChatItemAction = (action: Ytc.AddChatItemAction, skipDelayCheck = false, isReplay = false, liveTimeoutOrReplayMs = 0, extraDelay = 0): Ytc.ParsedMessage | undefined => {
  const actionItem = action.item;
  const renderer = actionItem.liveChatTextMessageRenderer ??
    actionItem.liveChatPaidMessageRenderer ??
    actionItem.liveChatPaidStickerRenderer ??
    actionItem.liveChatMembershipItemRenderer;
  if (!renderer) {
    return;
  }

  const authorTypes: string[] = [];
  if (renderer.authorBadges) {
    renderer.authorBadges.forEach((badge) => {
      const badgeRenderer = badge.liveChatAuthorBadgeRenderer;
      const iconType = badgeRenderer.icon?.iconType;
      if (iconType != null) {
        authorTypes.push(iconType.toLowerCase());
      } else if (badgeRenderer.customThumbnail) {
        authorTypes.push('member');
      } else {
        authorTypes.push(badgeRenderer.tooltip.toLowerCase());
      }
    });
  }
  const runs = parseMessageRuns(renderer.message?.runs);
  const timestampUsec = parseInt(renderer.timestampUsec);
  const timestampText = renderer.timestampText?.simpleText;
  const liveShowtimeMs = (timestampUsec / 1000) + liveTimeoutOrReplayMs;

  /**
   * Extra delay is calculated based on previous chunk delay, and will only
   * be applied if the current chunk is also delayed.
   * Hopefully this reduces chat freezing for subsequent late chunks, while
   * not adding extra delay when chunks arrive normally.
   */
  if (!skipDelayCheck && !isReplay && !checkedChunkDelay) {
    const diff = Date.now() - liveShowtimeMs;

    nextChunkDelay = diff > 0 ? Math.min(Math.round(diff / 1000) * 1000, 5000) : 0;
    checkedChunkDelay = true;

    if (nextChunkDelay > 0 && extraDelay > 0) {
      console.log('Subsequent late chunks, adding an extra delay of ' + extraDelay.toString());
    }
  }

  const item: Ytc.ParsedMessage = {
    author: {
      name: renderer.authorName.simpleText,
      id: renderer.authorExternalChannelId,
      types: authorTypes
    },
    message: runs,
    timestamp: isReplay && timestampText != null ? timestampText : formatTimestamp(timestampUsec),
    showtime: isReplay ? liveTimeoutOrReplayMs : liveShowtimeMs + (nextChunkDelay > 0 ? extraDelay : 0),
    messageId: renderer.id
  };

  if (isPaidMessageRenderer(actionItem, renderer)) {
    item.superChat = {
      amount: renderer.purchaseAmountText.simpleText,
      bodyBackgroundColor: colorToHex(renderer.bodyBackgroundColor),
      bodyTextColor: colorToHex(renderer.bodyTextColor),
      nameColor: colorToHex(renderer.authorNameTextColor),
      headerBackgroundColor: colorToHex(renderer.headerBackgroundColor),
      headerTextColor: colorToHex(renderer.headerTextColor)
    };
  } else if (isPaidStickerRenderer(actionItem, renderer)) {
    item.superSticker = {
      src: fixUrl(renderer.sticker.thumbnails[0].url),
      alt: renderer.sticker.accessibility?.accessibilityData.label,
      amount: renderer.purchaseAmountText.simpleText,
      bodyBackgroundColor: colorToHex(renderer.moneyChipBackgroundColor),
      bodyTextColor: colorToHex(renderer.moneyChipTextColor),
      nameColor: colorToHex(renderer.authorNameTextColor)
    };
  } else if (isMembershipRenderer(actionItem, renderer)) {
    item.membership = true;
    item.message = parseMessageRuns(renderer.headerSubtext.runs);
  }
  return item;
};

const parseAuthorBonkedAction = (action: Ytc.AuthorBonkedAction): Ytc.ParsedBonk | undefined => {
  return {
    replacedMessage: parseMessageRuns(action.deletedStateMessage.runs),
    authorId: action.externalChannelId
  };
};

const parseMessageDeletedAction = (action: Ytc.MessageDeletedAction): Ytc.ParsedDeleted | undefined => {
  return {
    replacedMessage: parseMessageRuns(action.deletedStateMessage.runs),
    messageId: action.targetItemId
  };
};

const parsePinnedMessageAction = (action: Ytc.AddPinnedAction): Ytc.ParsedPinned | undefined => {
  const baseRenderer = action.bannerRenderer.liveChatBannerRenderer;
  const parsedContents = parseAddChatItemAction(
    { item: baseRenderer.contents }, true
  );
  if (!parsedContents) {
    return;
  }
  return {
    type: 'pin',
    item: {
      header: parseMessageRuns(
        baseRenderer.header.liveChatBannerHeaderRenderer.text.runs
      ),
      contents: parsedContents
    }
  };
};

const processCommonAction = (action: Ytc.ReplayAction, isReplay: boolean, skipDelayCheck: boolean, liveTimeoutOrReplayMs: number, extraDelay = 0): Ytc.ParsedMessage | Ytc.ParsedMisc | undefined => {
  if (action.addChatItemAction) {
    return parseAddChatItemAction(action.addChatItemAction, skipDelayCheck, isReplay, liveTimeoutOrReplayMs, extraDelay);
  } else if (action.addBannerToLiveChatCommand) {
    return parsePinnedMessageAction(action.addBannerToLiveChatCommand);
  } else if (action.removeBannerForLiveChatCommand) {
    return { type: 'unpin' } as const;
  }
};

const processLiveAction = (action: Ytc.Action, isReplay: boolean, skipDelayCheck: boolean, liveTimeoutMs: number, extraDelay: number): Ytc.ParsedAction | undefined => {
  const common = processCommonAction(action, isReplay, skipDelayCheck, liveTimeoutMs, extraDelay);
  if (common) {
    return common;
  } else if (action.markChatItemsByAuthorAsDeletedAction) {
    return parseAuthorBonkedAction(action.markChatItemsByAuthorAsDeletedAction);
  } else if (action.markChatItemAsDeletedAction) {
    return parseMessageDeletedAction(action.markChatItemAsDeletedAction);
  }
};

const sortAction = (action: Ytc.ParsedAction, messageArray: Ytc.ParsedMessage[], bonkArray: Ytc.ParsedBonk[], deleteArray: Ytc.ParsedDeleted[], miscArray: Ytc.ParsedMisc[]): void => {
  if (isParsedMessage(action)) {
    messageArray.push(action);
  } else if (isParsedBonk(action)) {
    bonkArray.push(action);
  } else if (isParsedDelete(action)) {
    deleteArray.push(action);
  } else {
    miscArray.push(action);
  }
};

export const parseChatResponse = (response: string, isReplay: boolean, isInitial = false): Ytc.ParsedChunk | undefined => {
  const parsedResponse: Ytc.RawResponse = JSON.parse(response);
  const base =
    parsedResponse.continuationContents?.liveChatContinuation ??
    parsedResponse.contents?.liveChatRenderer;
  const actionsArray = base?.actions;
  if (!base || !actionsArray) {
    console.debug('Invalid response:', parsedResponse);
    return;
  }

  const messageArray: Ytc.ParsedMessage[] = [];
  const bonkArray: Ytc.ParsedBonk[] = [];
  const deleteArray: Ytc.ParsedDeleted[] = [];
  const miscArray: Ytc.ParsedMisc[] = [];

  const liveTimeoutMs =
    base.continuations[0].timedContinuationData?.timeoutMs ??
    base.continuations[0].invalidationContinuationData?.timeoutMs ?? 0;

  checkedChunkDelay = false;
  const extraDelay = nextChunkDelay;

  actionsArray.forEach((action) => {
    let parsedAction: Ytc.ParsedAction | undefined;

    if (action.replayChatItemAction) {
      const replayAction = action.replayChatItemAction;
      const replayTimeMs = parseInt(replayAction.videoOffsetTimeMsec);
      parsedAction = processCommonAction(replayAction.actions[0], isReplay, isInitial, replayTimeMs);
    } else {
      parsedAction = processLiveAction(action, isReplay, isInitial, liveTimeoutMs, extraDelay);
    }

    if (!parsedAction) {
      console.debug('Unparsed action:', action);
      return;
    }
    sortAction(parsedAction, messageArray, bonkArray, deleteArray, miscArray);
  });

  return {
    messages: messageArray,
    bonks: bonkArray,
    deletions: deleteArray,
    miscActions: miscArray,
    isReplay
  };
};
