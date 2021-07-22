const formatTimestamp = (timestamp) => {
  return (new Date(parseInt(timestamp) / 1000))
    .toLocaleTimeString(
      navigator.language, { hour: '2-digit', minute: '2-digit' }
    );
};

const colorConversionTable = {
  4280191205: 'blue',
  4278248959: 'lightblue',
  4280150454: 'turquoise',
  4294953512: 'yellow',
  4294278144: 'orange',
  4293467747: 'pink',
  4293271831: 'red'
};

/**
 * @param {MessageRun[]} runs
 */
const parseMessageRuns = (runs) => {
  /**
   * @typedef {Object} ParsedRun
   * @property {'link'|'text'|'emote'} type
   * @property {string} [text]
   * @property {string} [url]
   * @property {string} [src]
   */
  /** @type {ParsedRun[]} */
  const parsedRuns = [];
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

/**
 * @param {AddChatItemAction} action
 * @param {boolean} isReplay
 * @param {number} offsetMs If replay, is the exact msec to show message
 */
const parseAddChatItemAction = (action, isReplay, offsetMs) => {
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

  const authorTypes = [];
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
  const timestampText = renderer.timestampText?.simpleText; // only used on replays
  const item = {
    author: {
      name: renderer.authorName.simpleText,
      id: renderer.authorExternalChannelId,
      types: authorTypes
    },
    message: runs,
    timestamp: isReplay ? timestampText : formatTimestamp(timestampUsec),
    showtime: isReplay ? offsetMs : (timestampUsec / 1000) + offsetMs,
    messageId: renderer.id
  };
  // TODO: Super stickers
  if (actionItem.liveChatPaidMessageRenderer) {
    item.superchat = {
      amount: renderer.purchaseAmountText.simpleText,
      color: colorConversionTable[renderer.bodyBackgroundColor]
    };
  }
  return item;
};

/**
 * @param {AuthorBonkedAction} action
 */
const parseAuthorBonkedAction = (action) => {
  if (!action.deletedStateMessage || !action.externalChannelId) {
    return false;
  }
  return {
    replacedMessage: parseMessageRuns(action.deletedStateMessage.runs),
    authorId: action.externalChannelId
  };
};

/**
 * @param {MessageDeletedAction} action
 */
const parseMessageDeletedAction = (action) => {
  if (!action.deletedStateMessage || !action.targetItemId) {
    return false;
  }
  return {
    replacedMessage: parseMessageRuns(action.deletedStateMessage.runs),
    messageId: action.targetItemId
  };
};

/**
 * @param {AddPinnedAction} action
 */
const parsePinnedMessageAction = (action) => {
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

/**
 * @param {YtcResponse} response JSON response.
 * @param {boolean} isReplay
 * @param {boolean} [isInitial=false] Whether JSON is initial data.
 * @returns {*} actionChunk payload.
 */
export const parseChatResponse = (response, isReplay, isInitial = false) => {
  response = JSON.parse(response);
  const base =
    response.continuationContents?.liveChatContinuation ||
    response.contents?.liveChatRenderer;
  const actionsArray = base?.actions;
  if (!actionsArray) {
    console.debug('Invalid response:', response);
    return;
  }

  const addChatItemActions = [];
  const bonkActions = [];
  const deletionActions = [];
  const miscActions = [];

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
        replayAction.actions[0]?.addChatItemAction, isReplay, replayTimeMs
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
    type: 'actionChunk',
    messages: addChatItemActions,
    bonks: bonkActions,
    deletions: deletionActions,
    miscActions,
    isReplay,
    isInitial
  };
};
