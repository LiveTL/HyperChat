import { isPaidMessageRenderer, isPaidStickerRenderer } from './chat-utils';

const formatTimestamp = (timestampUsec: number) => {
  return (new Date(timestampUsec / 1000))
    .toLocaleTimeString(
      navigator.language, { hour: '2-digit', minute: '2-digit' }
    );
};

const colorToHex = (color: number) => {
  return color.toString(16).slice(-6);
};

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
        src: fixUrl(run.emoji.image.thumbnails[0].url)
      });
    }
  });
  return parsedRuns;
};

const parseAddChatItemAction = (action?: Ytc.AddChatItemAction, isReplay = false, offsetMs = 0): Ytc.ParsedMessage | undefined => {
  if (!action || !action.item) {
    return;
  }
  const actionItem = action.item;
  const renderer = actionItem.liveChatTextMessageRenderer ||
    actionItem.liveChatPaidMessageRenderer ||
    actionItem.liveChatPaidStickerRenderer;
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
    showtime: isReplay ? offsetMs : (timestampUsec / 1000) + offsetMs + 2000, // TODO: Figure out how not to hardcode this, it causes delay between LTL and non-HC YTC
    messageId: renderer.id
  };

  if (isPaidMessageRenderer(actionItem, renderer)) {
    item.superChat = {
      amount: renderer.purchaseAmountText.simpleText,
      backgroundColor: colorToHex(renderer.bodyBackgroundColor),
      textColor: colorToHex(renderer.bodyTextColor),
      nameColor: colorToHex(renderer.authorNameTextColor)
    };
  } else if (isPaidStickerRenderer(actionItem, renderer)) {
    item.superSticker = {
      src: fixUrl(renderer.sticker.thumbnails[0].url),
      amount: renderer.purchaseAmountText.simpleText,
      backgroundColor: colorToHex(renderer.moneyChipBackgroundColor),
      textColor: colorToHex(renderer.moneyChipTextColor),
      nameColor: colorToHex(renderer.authorNameTextColor)
    };
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
    type: 'messagePinned',
    item: {
      header: parseMessageRuns(
        baseRenderer.header.liveChatBannerHeaderRenderer.text.runs
      ),
      contents: parsedContents
    }
  };
};

export const parseChatResponse = (response: string, isReplay: boolean, isInitial = false): Chat.ParsedChunk | undefined => {
  const parsedResponse: Ytc.RawResponse = JSON.parse(response);
  const base =
    parsedResponse.continuationContents?.liveChatContinuation ||
    parsedResponse.contents?.liveChatRenderer;
  const actionsArray = base?.actions;
  if (!base || !actionsArray) {
    console.debug('Invalid response:', parsedResponse);
    return;
  }

  const addChatItemActions: Ytc.ParsedMessage[] = [];
  const bonkActions: Ytc.ParsedBonk[] = [];
  const deletionActions: Ytc.ParsedDeleted[] = [];
  const miscActions: Ytc.ParsedMisc[] = [];

  actionsArray.forEach((action) => {
    let parsedAction;
    if (action.addChatItemAction) {
      const liveTimeoutMs =
        base.continuations[0].timedContinuationData?.timeoutMs ||
        base.continuations[0].invalidationContinuationData?.timeoutMs;
      parsedAction =
        parseAddChatItemAction(
          action.addChatItemAction, isReplay, liveTimeoutMs
        );
    } else if (action.replayChatItemAction) {
      const replayAction = action.replayChatItemAction;
      const replayTimeMs = replayAction.videoOffsetTimeMsec;
      parsedAction = parseAddChatItemAction(
        replayAction.actions[0]?.addChatItemAction, isReplay, parseInt(replayTimeMs)
      );
    }
    if (parsedAction) {
      addChatItemActions.push(parsedAction);
      return;
    }

    if (action.markChatItemsByAuthorAsDeletedAction) {
      parsedAction = parseAuthorBonkedAction(
        action.markChatItemsByAuthorAsDeletedAction
      );
      if (parsedAction) bonkActions.push(parsedAction);
    } else if (action.markChatItemAsDeletedAction) {
      parsedAction = parseMessageDeletedAction(
        action.markChatItemAsDeletedAction
      );
      if (parsedAction) deletionActions.push(parsedAction);
    } else if (action.addBannerToLiveChatCommand) {
      parsedAction = parsePinnedMessageAction(
        action.addBannerToLiveChatCommand
      );
      if (parsedAction) miscActions.push(parsedAction);
    } else if (action.removeBannerForLiveChatCommand) {
      parsedAction = { type: 'removePinned' } as const;
      miscActions.push(parsedAction);
    }

    if (!parsedAction) {
      console.debug('Unparsed action:', action);
    }
  });

  return {
    type: isInitial ? 'initialDataChunk' : 'actionChunk',
    messages: addChatItemActions,
    bonks: bonkActions,
    deletions: deletionActions,
    miscActions,
    isReplay
  };
};
