import {
  isPaidMessageRenderer,
  isPaidStickerRenderer,
  isMembershipRenderer,
  isParsedMessage,
  isParsedBonk,
  isParsedDelete
} from './chat-utils';

const formatTimestamp = (timestampUsec: number) => {
  return (new Date(timestampUsec / 1000)).toLocaleTimeString('en-GB');
};

const colorToHex = (color: number) => color.toString(16).slice(-6);

const fixUrl = (url: string) => {
  if (url.startsWith('//')) {
    return 'https:' + url;
  } else if (url.startsWith('/')) {
    return 'https://www.youtube.com' + url;
  } else {
    return url;
  }
};

const parseMessageRuns = (runs?: Ytc.MessageRun[]) => {
  const parsedRuns: Ytc.ParsedRun[] = [];
  if (!runs) {
    return parsedRuns;
  }
  runs.forEach((run) => {
    if (run.text && run.navigationEndpoint) {
      parsedRuns.push({
        type: 'link',
        text: decodeURIComponent(escape(unescape(encodeURIComponent(
          run.text
        )))),
        url: fixUrl(run.navigationEndpoint.commandMetadata.webCommandMetadata.url)
      });
    } else if (run.text) {
      parsedRuns.push({
        type: 'text',
        text: decodeURIComponent(escape(unescape(encodeURIComponent(
          run.text
        ))))
      });
    } else if (run.emoji) {
      parsedRuns.push({
        type: 'emote',
        src: fixUrl(run.emoji.image.thumbnails[0].url),
        alt: run.emoji.image.accessibility.accessibilityData.label
      });
    }
  });
  return parsedRuns;
};

const parseAddChatItemAction = (action: Ytc.AddChatItemAction, isReplay = false, liveTimeoutOrReplayMs = 0): Ytc.ParsedMessage | undefined => {
  if (!action.item) {
    return;
  }
  const actionItem = action.item;
  const renderer = actionItem.liveChatTextMessageRenderer ||
    actionItem.liveChatPaidMessageRenderer ||
    actionItem.liveChatPaidStickerRenderer ||
    actionItem.liveChatMembershipItemRenderer;
  if (!renderer || !renderer.authorName) {
    return;
  }

  const authorTypes: string[] = [];
  if (renderer.authorBadges) {
    renderer.authorBadges.forEach((badge) => {
      const badgeRenderer = badge.liveChatAuthorBadgeRenderer;
      const iconType = badgeRenderer.icon?.iconType;
      if (iconType) {
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
  const item: Ytc.ParsedMessage = {
    author: {
      name: renderer.authorName.simpleText,
      id: renderer.authorExternalChannelId,
      types: authorTypes
    },
    message: runs,
    timestamp: isReplay && timestampText ? timestampText : formatTimestamp(timestampUsec),
    showtime: isReplay ? liveTimeoutOrReplayMs : (timestampUsec / 1000) + liveTimeoutOrReplayMs + 2000, // TODO: Figure out how not to hardcode this, it causes delay between LTL and non-HC YTC
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
  if (!action.deletedStateMessage || !action.externalChannelId) {
    return;
  }
  return {
    replacedMessage: parseMessageRuns(action.deletedStateMessage.runs),
    authorId: action.externalChannelId
  };
};

const parseMessageDeletedAction = (action: Ytc.MessageDeletedAction): Ytc.ParsedDeleted | undefined => {
  if (!action.deletedStateMessage || !action.targetItemId) {
    return;
  }
  return {
    replacedMessage: parseMessageRuns(action.deletedStateMessage.runs),
    messageId: action.targetItemId
  };
};

const parsePinnedMessageAction = (action: Ytc.AddPinnedAction): Ytc.ParsedPinned | undefined => {
  const baseRenderer = action.bannerRenderer?.liveChatBannerRenderer;
  if (!baseRenderer) {
    return;
  }
  const parsedContents = parseAddChatItemAction(
    { item: baseRenderer.contents }
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

const processCommonAction = (action: Ytc.ReplayAction, isReplay: boolean, liveTimeoutOrReplayMs?: number): Ytc.ParsedMessage | Ytc.ParsedMisc | undefined => {
  if (action.addChatItemAction) {
    return parseAddChatItemAction(action.addChatItemAction, isReplay, liveTimeoutOrReplayMs);
  } else if (action.addBannerToLiveChatCommand) {
    return parsePinnedMessageAction(action.addBannerToLiveChatCommand);
  } else if (action.removeBannerForLiveChatCommand) {
    return { type: 'unpin' } as const;
  }
};

const processLiveAction = (action: Ytc.Action, isReplay: boolean, liveTimeoutMs?: number) => {
  const common = processCommonAction(action, isReplay, liveTimeoutMs);
  if (common) {
    return common;
  } else if (action.markChatItemsByAuthorAsDeletedAction) {
    return parseAuthorBonkedAction(action.markChatItemsByAuthorAsDeletedAction);
  } else if (action.markChatItemAsDeletedAction) {
    return parseMessageDeletedAction(action.markChatItemAsDeletedAction);
  }
};

const sortAction = (action: Ytc.ParsedAction, messageArray: Ytc.ParsedMessage[], bonkArray: Ytc.ParsedBonk[], deleteArray: Ytc.ParsedDeleted[], miscArray: Ytc.ParsedMisc[]) => {
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

export const parseChatResponse = (response: string, isReplay: boolean): Ytc.ParsedChunk | undefined => {
  const parsedResponse: Ytc.RawResponse = JSON.parse(response);
  const base =
    parsedResponse.continuationContents?.liveChatContinuation ||
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
    base.continuations[0].timedContinuationData?.timeoutMs ||
    base.continuations[0].invalidationContinuationData?.timeoutMs;

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
    isReplay
  };
};
