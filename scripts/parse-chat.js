const isReplay = window.location.href.startsWith(
  'https://www.youtube.com/live_chat_replay'
);

const formatTimestamp = (timestamp) => {
  return (new Date(parseInt(timestamp) / 1000)).toLocaleTimeString(navigator.language,
    { hour: '2-digit', minute: '2-digit' });
};

const getMillis = (timestamp, usec) => {
  let secs = Array.from(timestamp.split(':'), t => parseInt(t)).reverse();
  secs = secs[0] + (secs[1] ? secs[1] * 60 : 0) + (secs[2] ? secs[2] * 60 * 60 : 0);
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

const parseMessageRuns = (runs) => {
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

const parseAddChatItemAction = (action) => {
  // console.log(action);
  const actionItem = action.item;
  if (!actionItem) {
    return false;
  }
  const renderer = actionItem.liveChatTextMessageRenderer ||
    actionItem.liveChatPaidMessageRenderer ||
    actionItem.liveChatPaidStickerRenderer;
  if (!renderer || !renderer.authorName || !renderer.message) { // FIXME: Doesn't allow empty superchats
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

export const parseChatResponse = (response, isInitial = false) => {
  response = JSON.parse(response);
  const parsedActions = [];
  const actionsArray =
    response.continuationContents?.liveChatContinuation?.actions ||
    response.contents?.liveChatRenderer?.actions;
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
