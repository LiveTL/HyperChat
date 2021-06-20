const isReplay = window.location.href.startsWith(
  'https://www.youtube.com/live_chat_replay'
);

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
 * Expected YTC message run object.
 *
 * @typedef {Object} ytcMessageRun
 * @property {string} [text]
 *
 * @property {Object} [navigationEndpoint]
 * @property {Object} navigationEndpoint.commandMetadata
 * @property {Object} navigationEndpoint.commandMetadata.webCommandMetadata
 * @property {string} navigationEndpoint.commandMetadata.webCommandMetadata.url
 *
 * @property {Object} [emoji]
 * @property {Object} emoji.image
 * @property {{url: string}[]} emoji.image.thumbnails
 */

/**
 * @param {ytcMessageRun[]} runs
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
 * Expected YTC addChatItemAction object.
 *
 * @typedef {Object} AddChatItemAction
 * @property {Object} item
 * @property {MessageRenderer} [item.liveChatTextMessageRenderer]
 * @property {MessageRenderer} [item.liveChatPaidMessageRenderer]
 * @property {MessageRenderer} [item.liveChatPaidStickerRenderer]
 */
/**
 * Expected YTC message renderer object.
 *
 * @typedef {Object} MessageRenderer
 * @property {Object} message
 * @property {ytcMessageRun[]} message.runs
 * @property {{simpleText: string}} authorName
 * @property {AuthorBadge[]} [authorBadges]
 * @property {string} id
 * @property {string} timestampUsec Timestamp in microseconds
 * @property {string} authorExternalChannelId
 * @property {{simpleText: string}} [timestampText] Only available on VODs
 * @property {{simpleText: string}} [purchaseAmountText] Only available on superchats
 * @property {number} [bodyBackgroundColor] Only available on superchats
 */
/**
 * Expected YTC author badge object.
 *
 * @typedef {Object} AuthorBadge
 * @property {Object} liveChatAuthorBadgeRenderer
 * @property {string} liveChatAuthorBadgeRenderer.tooltip
 * @property {Object} [liveChatAuthorBadgeRenderer.icon] Only available for verified, mods and owner
 * @property {string} liveChatAuthorBadgeRenderer.icon.iconType Unlocalized string
 */

/**
 * @param {AddChatItemAction} action
 */
const parseAddChatItemAction = (action) => {
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
  // TODO: Super stickers
  if (actionItem.liveChatPaidMessageRenderer) {
    item.superchat = {
      amount: renderer.purchaseAmountText.simpleText,
      color: colorConversionTable[renderer.bodyBackgroundColor]
    };
  }
  return {
    type: 'addChatItem',
    item: item
  };
};

/**
 * Expected YTC markChatItemsByAuthorAsDeletedAction object.
 *
 * @typedef {Object} AuthorBonkedAction
 * @property {Object} deletedStateMessage Message to replace deleted messages.
 * @property {ytcMessageRun[]} deletedStateMessage.runs
 * @property {string} externalChannelId ID of channel that was bonked.
 */

/**
 * @param {AuthorBonkedAction} action
 */
const parseAuthorBonkedAction = (action) => {
  if (!action.deletedStateMessage || !action.externalChannelId) {
    return false;
  }
  return {
    type: 'authorBonked',
    item: {
      replacedMessage: parseMessageRuns(action.deletedStateMessage.runs),
      authorId: action.externalChannelId
    }
  };
};

/**
 * Expected YTC markChatItemAsDeletedAction object.
 *
 * @typedef {Object} MessageDeletedAction
 * @property {Object} deletedStateMessage Message to replace deleted messages.
 * @property {ytcMessageRun[]} deletedStateMessage.runs
 * @property {string} targetItemId ID of message to be deleted.
 */

/**
 * @param {MessageDeletedAction} action
 */
const parseMessageDeletedAction = (action) => {
  if (!action.deletedStateMessage || !action.targetItemId) {
    return false;
  }
  return {
    type: 'messageDeleted',
    item: {
      replacedMessage: parseMessageRuns(action.deletedStateMessage.runs),
      messageId: action.targetItemId
    }
  };
};

/**
 * Expected YTC JSON response.
 *
 * @typedef {Object} ytcResponse
 * @property {Object} [continuationContents]
 * @property {Object} continuationContents.liveChatContinuation
 * @property {ytcAction[]} [continuationContents.liveChatContinuation.actions]
 *
 * @property {Object} [contents]
 * @property {Object} contents.liveChatRenderer
 * @property {ytcAction[]} [contents.liveChatRenderer.actions]
 */
/**
 * Expected YTC action object.
 *
 * @typedef {Object} ytcAction
 * @property {AddChatItemAction} [addChatItemAction]
 * @property {{actions: ytcAction[]}} [replayChatItemAction]
 * @property {AuthorBonkedAction} [markChatItemsByAuthorAsDeletedAction]
 * @property {MessageDeletedAction} [markChatItemAsDeletedAction]
 */

/**
 * @param {ytcResponse} response
 * @param {boolean} [isInitial=false]
 */
export const parseChatResponse = (response, isInitial = false) => {
  response = JSON.parse(response);
  const parsedActions = [];
  const actionsArray =
    response.continuationContents?.liveChatContinuation.actions ||
    response.contents?.liveChatRenderer.actions;
  if (!actionsArray) {
    console.debug('Invalid response:', response);
    return;
  }

  actionsArray.forEach((action) => {
    let parsedAction;
    if (action.addChatItemAction) {
      parsedAction = parseAddChatItemAction(action.addChatItemAction);
    } else if (action.replayChatItemAction?.actions[0]?.addChatItemAction) {
      parsedAction = parseAddChatItemAction(
        action.replayChatItemAction.actions[0].addChatItemAction
      );
    } else if (action.markChatItemsByAuthorAsDeletedAction) {
      parsedAction = parseAuthorBonkedAction(
        action.markChatItemsByAuthorAsDeletedAction
      );
    } else if (action.markChatItemAsDeletedAction) {
      parsedAction = parseMessageDeletedAction(
        action.markChatItemAsDeletedAction
      );
    }

    if (!parsedAction) {
      console.debug('Unparsed action:', action);
      return;
    }
    parsedActions.push(parsedAction);
  });
  if (parsedActions.length < 1) {
    return;
  }

  return {
    type: 'actionChunk',
    actions: parsedActions,
    isReplay,
    isInitial
  };
};
