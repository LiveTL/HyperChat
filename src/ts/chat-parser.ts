import {
  isPaidMessageRenderer,
  isPaidStickerRenderer,
  isMembershipRenderer
} from './chat-utils';

const formatTimestamp = (timestampUsec: number): string => {
  return (new Date(timestampUsec / 1000))
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
        alt: run.emoji.image.accessibility?.accessibilityData.label ?? run.emoji.emojiId ?? 'emoji'
      });
    }
  });
  return parsedRuns;
};

const parseAddChatItemAction = (action: Ytc.AddChatItemAction, isReplay = false, liveTimeoutOrReplayMs = 0): Ytc.ParsedMessage | undefined => {
  const actionItem = action.item;
  const renderer = actionItem.liveChatTextMessageRenderer ??
    actionItem.liveChatPaidMessageRenderer ??
    actionItem.liveChatPaidStickerRenderer ??
    actionItem.liveChatMembershipItemRenderer;
  if (!renderer) {
    return;
  }

  const authorTypes: string[] = [];
  let customBadge: Ytc.ParsedImage | undefined;
  if (renderer.authorBadges) {
    renderer.authorBadges.forEach((badge) => {
      const badgeRenderer = badge.liveChatAuthorBadgeRenderer;
      const iconType = badgeRenderer.icon?.iconType;
      if (iconType != null) {
        authorTypes.push(iconType.toLowerCase());
      } else if (badgeRenderer.customThumbnail) {
        authorTypes.push('member');
        customBadge = {
          src: fixUrl(badgeRenderer.customThumbnail.thumbnails[0].url),
          alt: badgeRenderer.accessibility?.accessibilityData.label ?? 'member'
        };
      } else {
        authorTypes.push(badgeRenderer.tooltip.toLowerCase());
      }
    });
  }
  const runs = parseMessageRuns(renderer.message?.runs);
  const timestampUsec = parseInt(renderer.timestampUsec);
  const timestampText = renderer.timestampText?.simpleText;
  const liveShowtimeMs = (timestampUsec / 1000) + liveTimeoutOrReplayMs;

  const item: Ytc.ParsedMessage = {
    author: {
      name: renderer.authorName.simpleText,
      id: renderer.authorExternalChannelId,
      types: authorTypes,
      customBadge
    },
    message: runs,
    timestamp: isReplay && timestampText != null ? timestampText : formatTimestamp(timestampUsec),
    showtime: isReplay ? liveTimeoutOrReplayMs : liveShowtimeMs,
    messageId: renderer.id
  };

  if (isPaidMessageRenderer(renderer)) {
    item.superChat = {
      amount: renderer.purchaseAmountText.simpleText,
      bodyBackgroundColor: colorToHex(renderer.bodyBackgroundColor),
      bodyTextColor: colorToHex(renderer.bodyTextColor),
      nameColor: colorToHex(renderer.authorNameTextColor),
      headerBackgroundColor: colorToHex(renderer.headerBackgroundColor),
      headerTextColor: colorToHex(renderer.headerTextColor)
    };
  } else if (isPaidStickerRenderer(renderer)) {
    item.superSticker = {
      src: fixUrl(renderer.sticker.thumbnails[0].url),
      alt: renderer.sticker.accessibility?.accessibilityData.label ?? 'sticker',
      amount: renderer.purchaseAmountText.simpleText,
      bodyBackgroundColor: colorToHex(renderer.moneyChipBackgroundColor),
      bodyTextColor: colorToHex(renderer.moneyChipTextColor),
      nameColor: colorToHex(renderer.authorNameTextColor)
    };
  } else if (isMembershipRenderer(renderer)) {
    item.membership = {
      headerPrimaryText: parseMessageRuns(renderer.headerPrimaryText?.runs),
      headerSubtext: 'simpleText' in renderer.headerSubtext
        ? [
            {
              type: 'text',
              text: renderer.headerSubtext.simpleText
            }
          ]
        : parseMessageRuns(renderer.headerSubtext.runs)
    };
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

const processCommonAction = (action: Ytc.ReplayAction, isReplay: boolean, liveTimeoutOrReplayMs: number): Ytc.ParsedMessage | Ytc.ParsedMisc | undefined => {
  if (action.addChatItemAction) {
    return parseAddChatItemAction(action.addChatItemAction, isReplay, liveTimeoutOrReplayMs);
  } else if (action.addBannerToLiveChatCommand) {
    return parsePinnedMessageAction(action.addBannerToLiveChatCommand);
  } else if (action.removeBannerForLiveChatCommand) {
    return { type: 'unpin' } as const;
  }
};

const processLiveAction = (action: Ytc.Action, isReplay: boolean, liveTimeoutMs: number): Ytc.ParsedAction | undefined => {
  const common = processCommonAction(action, isReplay, liveTimeoutMs);
  if (common) {
    return common;
  } else if (action.markChatItemsByAuthorAsDeletedAction) {
    return parseAuthorBonkedAction(action.markChatItemsByAuthorAsDeletedAction);
  } else if (action.markChatItemAsDeletedAction) {
    return parseMessageDeletedAction(action.markChatItemAsDeletedAction);
  }
};

const sortAction = (action: Ytc.ParsedAction, messageArray: Ytc.ParsedMessage[], bonkArray: Ytc.ParsedBonk[], deleteArray: Ytc.ParsedDeleted[], miscArray: Ytc.ParsedMisc[]): void => {
  if ('message' in action) {
    messageArray.push(action);
  } else if ('replacedMessage' in action && 'authorId' in action) {
    bonkArray.push(action);
  } else if ('replacedMessage' in action && 'messageId' in action) {
    deleteArray.push(action);
  } else {
    miscArray.push(action);
  }
};

export const parseChatResponse = (response: string, isReplay: boolean): Ytc.ParsedChunk | undefined => {
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

  actionsArray.forEach((action) => {
    let parsedAction: Ytc.ParsedAction | undefined;

    if (action.replayChatItemAction) {
      const replayAction = action.replayChatItemAction;
      const replayTimeMs = parseInt(replayAction.videoOffsetTimeMsec);
      parsedAction = processCommonAction(replayAction.actions[0], isReplay, replayTimeMs);
    } else {
      parsedAction = processLiveAction(action, isReplay, liveTimeoutMs);
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
    isReplay,
    refresh: base.clientMessages != null
  };
};
