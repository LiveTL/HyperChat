const formatTimestamp = (timestampUsec: number) => {
  return (new Date(timestampUsec / 1000))
    .toLocaleTimeString(
      navigator.language, { hour: '2-digit', minute: '2-digit' }
    );
};

const colorToHex = (color: number) => {
  return color.toString(16).slice(-6);
};

const parseMessageRuns = (runs: Ytc.MessageRun[]) => {
  const parsedRuns = [] as Ytc.ParsedRun[];
  if (!runs) {
    return parsedRuns;
  }
  runs.forEach((run) => {
    if (run.text && run.navigationEndpoint) {
      let url = run.navigationEndpoint.commandMetadata.webCommandMetadata.url;
      if (url.startsWith('/')) {
        url = 'https://www.youtube.com'.concat(url);
      }
      parsedRuns.push({
        type: 'link',
        text: decodeURIComponent(escape(unescape(encodeURIComponent(
          run.text
        )))),
        url: url
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
        src: run.emoji.image.thumbnails[0].url
      });
    }
  });
  return parsedRuns;
};

const parseAddChatItemAction = (action?: Ytc.AddChatItemAction, isReplay = false, offsetMs = 0): Ytc.ParsedMessage | false => {
  if (!action || !action.item) {
    return false;
  }
  const actionItem = action.item;
  const renderer = actionItem.liveChatTextMessageRenderer ||
    actionItem.liveChatPaidMessageRenderer ||
    actionItem.liveChatPaidStickerRenderer;
  if (!renderer || !renderer.authorName) {
    return false;
  }

  const authorTypes = [] as string[];
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
  const item = {
    author: {
      name: renderer.authorName.simpleText,
      id: renderer.authorExternalChannelId,
      types: authorTypes
    },
    message: runs,
    timestamp: isReplay ? timestampText as string : formatTimestamp(timestampUsec),
    showtime: isReplay ? offsetMs : (timestampUsec / 1000) + offsetMs,
    messageId: renderer.id
  } as Ytc.ParsedMessage;
  // TODO: Super stickers
  if (actionItem.liveChatPaidMessageRenderer) {
    const superchatRenderer = renderer as Ytc.PaidMessageRenderer;
    item.superchat = {
      amount: superchatRenderer.purchaseAmountText.simpleText,
      color: colorToHex(superchatRenderer.bodyBackgroundColor)
    };
  }
  return item;
};

const parseAuthorBonkedAction = (action: Ytc.AuthorBonkedAction): Ytc.ParsedBonk | false => {
  if (!action.deletedStateMessage || !action.externalChannelId) {
    return false;
  }
  return {
    replacedMessage: parseMessageRuns(action.deletedStateMessage.runs),
    authorId: action.externalChannelId
  };
};

const parseMessageDeletedAction = (action: Ytc.MessageDeletedAction): Ytc.ParsedDeleted | false => {
  if (!action.deletedStateMessage || !action.targetItemId) {
    return false;
  }
  return {
    replacedMessage: parseMessageRuns(action.deletedStateMessage.runs),
    messageId: action.targetItemId
  };
};

const parsePinnedMessageAction = (action: Ytc.AddPinnedAction): Ytc.ParsedMisc<Ytc.ParsedPinned> | false => {
  const baseRenderer = action.bannerRenderer?.liveChatBannerRenderer;
  if (!baseRenderer) {
    return false;
  }
  const parsedContents = parseAddChatItemAction(
    { item: baseRenderer.contents }
  );
  if (!parsedContents) {
    return false;
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

export const parseChatResponse = (response: string, isReplay: boolean, isInitial = false): Chat.ActionChunk | undefined => {
  const parsedResponse = JSON.parse(response) as Ytc.RawResponse;
  const base =
    parsedResponse.continuationContents?.liveChatContinuation ||
    parsedResponse.contents?.liveChatRenderer;
  const actionsArray = base?.actions;
  if (!base || !actionsArray) {
    console.debug('Invalid response:', parsedResponse);
    return;
  }

  const addChatItemActions = [] as Ytc.ParsedMessage[];
  const bonkActions = [] as Ytc.ParsedBonk[];
  const deletionActions = [] as Ytc.ParsedDeleted[];
  const miscActions = [] as Ytc.ParsedMisc<unknown>[];

  actionsArray.forEach((action) => {
    let parsedAction;
    if (action.addChatItemAction) {
      const liveTimeoutMs =
        (base.continuations[0].timedContinuationData?.timeoutMs ||
        base.continuations[0].invalidationContinuationData?.timeoutMs) as number;
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
    } else if (action.addBannerToLiveChatCommand) { // TODO: Pinned message UI
      parsedAction = parsePinnedMessageAction(
        action.addBannerToLiveChatCommand
      );
      if (parsedAction) miscActions.push(parsedAction);
    } else if (action.removeBannerForLiveChatCommand) {
      parsedAction = { type: 'removePinned' };
      miscActions.push(parsedAction);
    }

    if (!parsedAction) {
      console.debug('Unparsed action:', action);
    }
  });

  return {
    messages: addChatItemActions,
    bonks: bonkActions,
    deletions: deletionActions,
    miscActions,
    isReplay,
    isInitial
  };
};
