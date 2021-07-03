const formatTimestamp = (timestamp) => {
  return (new Date(parseInt(timestamp) / 1000))
    .toLocaleTimeString(
      navigator.language, { hour: '2-digit', minute: '2-digit' }
    );
};

const getMillis = (timestamp, usec) => {
  let secs = Array.from(timestamp.split(':'), t => parseInt(t)).reverse();
  secs =
    secs[0] + (secs[1] ? secs[1] * 60 : 0) + (secs[2] ? secs[2] * 60 * 60 : 0);
  secs *= 1000;
  secs += usec % 1000;
  secs /= 1000;
  return secs;
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
 */
const parseAddChatItemAction = (action, isReplay) => {
  // console.log(action);
  const actionItem = action.item;
  if (!actionItem) {
    return false;
  }
  const renderer = actionItem.liveChatTextMessageRenderer ||
    actionItem.liveChatPaidMessageRenderer ||
    actionItem.liveChatPaidStickerRenderer;
  // FIXME: Doesn't allow empty superchats
  if (!renderer || !renderer.authorName || !renderer.message) {
    return false;
  }

  const authorTypes = [];
  if (renderer.authorBadges) {
    renderer.authorBadges.forEach((badge) =>
      authorTypes.push(badge.liveChatAuthorBadgeRenderer.tooltip.toLowerCase())
    );
  }
  const runs = parseMessageRuns(renderer.message.runs);
  const timestampUsec = parseInt(renderer.timestampUsec);
  console.debug({ runs, timestampUsec });
  const timestampText = renderer.timestampText?.simpleText; // only used on replays
  const date = new Date();
  const item = {
    author: {
      name: renderer.authorName.simpleText,
      id: renderer.authorExternalChannelId,
      types: authorTypes
    },
    message: runs,
    timestamp: isReplay ? timestampText : formatTimestamp(timestampUsec),
    showtime: isReplay ? getMillis(timestampText, timestampUsec)
      : date.getTime() - Math.round(timestampUsec / 1000),
    messageId: renderer.id
  };
  // FIXME: Showtime is backwards for live streams. Replay is fine.
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
 * @param {boolean} [isInitial=false] Whether JSON is initial data.
 * @returns {*} actionChunk payload.
 */
export const parseChatResponse = (response, isReplay, isInitial = false) => {
  response = JSON.parse(response);
  const actionsArray =
    response.continuationContents?.liveChatContinuation.actions ||
    response.contents?.liveChatRenderer.actions;
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
      parsedAction =
        parseAddChatItemAction(action.addChatItemAction, isReplay);
    } else if (action.replayChatItemAction?.actions[0]?.addChatItemAction) {
      parsedAction = parseAddChatItemAction(
        action.replayChatItemAction.actions[0].addChatItemAction, isReplay
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
