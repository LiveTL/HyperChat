import {
  isPaidMessageRenderer,
  isPaidStickerRenderer,
  isMembershipRenderer,
  isMembershipGiftPurchaseRenderer
} from './chat-utils';
import { currentDomain } from './chat-constants';

// Source: https://stackoverflow.com/a/64396666
const standardEmoji =
  /^[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]$/u;

const formatTimestamp = (timestampUsec: number): string => {
  return (new Date(timestampUsec / 1000))
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const colorToHex = (color: number): string => color.toString(16).slice(-6);

const fixUrl = (url: string): string => {
  if (url.startsWith('//')) {
    return 'https:' + url;
  } else if (url.startsWith('/')) {
    return `${currentDomain}${url}`;
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
        styles: (run.bold ? ['bold'] : []).concat(run.deemphasize ? ['deemphasize'] : []),
        text: decodeURIComponent(escape(unescape(encodeURIComponent(
          run.text
        ))))
      });
    } else if (run.emoji) {
      const parsed: Ytc.ParsedEmojiRun = {
        type: 'emoji',
        src: fixUrl(run.emoji.image.thumbnails[0].url),
        alt: run.emoji.image.accessibility?.accessibilityData.label ?? run.emoji.emojiId ?? 'emoji'
      };
      if (standardEmoji.test(parsed.alt)) parsed.standardEmoji = true;
      parsedRuns.push(parsed);
    }
  });
  return parsedRuns;
};

// takes an array of runs, finds newline-only runs, and splits the array by them, up to maxSplit times
// final output will have maximum length of maxSplit + 1
// maxSplit = -1 will have no limit for splits
const splitRunsByNewline = (runs: Ytc.ParsedRun[], maxSplit: number = -1): Ytc.ParsedRun[][] => 
  runs.reduce((acc: Ytc.ParsedRun[][], run: Ytc.ParsedRun) => {
    if (run.type === 'text' && run.text === '\n' && (maxSplit == -1 || acc.length <= maxSplit)) {
      acc.push([]);
    } else {
      acc[acc.length - 1].push(run);
    }
    return acc;
  }, [[]]);

const parseChatSummary = (renderer: Ytc.AddChatItem, actionId: string, showtime: number): Ytc.ParsedSummary | undefined => {
  if (!renderer.liveChatBannerChatSummaryRenderer) {
    return;
  }
  const baseRenderer = renderer.liveChatBannerChatSummaryRenderer!;
  const runs = parseMessageRuns(renderer.liveChatBannerChatSummaryRenderer?.chatSummary.runs);
  const splitRuns = splitRunsByNewline(runs, 2);
  if (splitRuns.length < 3) {
    // YT probably changed the format, refuse to do anything to avoid breaking
    return;
  }
  const subheader = splitRuns[1].map(run => {
    if (run.type === 'text') {
      // turn subheader into a link to YT's support page detailing the AI summary feature
      return { type: 'link', text: run.text, url: 'https://support.google.com/youtube/thread/18138167?msgid=284199217' } as Ytc.ParsedLinkRun;
    } else {
      return run;
    }
  });
  const item: Ytc.ParsedSummary = {
    type: 'summary',
    actionId: baseRenderer.liveChatSummaryId,
    item: {
      header: splitRuns[0],
      subheader: subheader,
      message: splitRuns[2],
    },
    showtime: showtime,
  };
  return item;
}

const parseRedirectBanner = (renderer: Ytc.AddChatItem, actionId: string, showtime: number): Ytc.ParsedRedirect | undefined => {
  if (!renderer.liveChatBannerRedirectRenderer) {
    return;
  }
  const baseRenderer = renderer.liveChatBannerRedirectRenderer!;
  const profileIcon = {
    src: fixUrl(baseRenderer.authorPhoto?.thumbnails[0].url ?? ''),
    alt: 'Redirect profile icon'
  };
  const url = baseRenderer.inlineActionButton?.buttonRenderer.command.urlEndpoint?.url || 
    (baseRenderer.inlineActionButton?.buttonRenderer.command.watchEndpoint?.videoId ?
       "/watch?v=" + baseRenderer.inlineActionButton?.buttonRenderer.command.watchEndpoint?.videoId 
       : '');
  const item: Ytc.ParsedRedirect = {
    type: 'redirect',
    actionId: actionId,
    item: {
      message: parseMessageRuns(baseRenderer.bannerMessage.runs),
      profileIcon: profileIcon,
      action: {
        url: fixUrl(url),
        text: parseMessageRuns(baseRenderer.inlineActionButton?.buttonRenderer.text?.runs),
      }
    },
    showtime: showtime,
  };
  return item;
}

const parseAddChatItemAction = (action: Ytc.AddChatItemAction, isReplay = false, liveTimeoutOrReplayMs = 0): Ytc.ParsedMessage | undefined => {
  const actionItem = action.item;
  const renderer = actionItem.liveChatTextMessageRenderer ??
    actionItem.liveChatPaidMessageRenderer ??
    actionItem.liveChatPaidStickerRenderer ??
    actionItem.liveChatMembershipItemRenderer ??
    actionItem.liveChatSponsorshipsGiftPurchaseAnnouncementRenderer ??
    actionItem.liveChatSponsorshipsGiftRedemptionAnnouncementRenderer;
  if (!renderer) {
    return;
  }

  const isGiftPurchase = isMembershipGiftPurchaseRenderer(renderer);
  const messageRenderer = isGiftPurchase ? renderer.header.liveChatSponsorshipsHeaderRenderer : renderer;

  const authorTypes: string[] = [];
  let customBadge: Ytc.ParsedImage | undefined;
  if (messageRenderer.authorBadges) {
    messageRenderer.authorBadges.forEach((badge) => {
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
  const runs = parseMessageRuns(messageRenderer.message?.runs);
  const timestampUsec = parseInt(renderer.timestampUsec || (Date.now() * 1000).toString());
  const timestampText = messageRenderer.timestampText?.simpleText;
  const liveShowtimeMs = (timestampUsec / 1000) + liveTimeoutOrReplayMs;
  const profileIcon = {
    src: fixUrl(messageRenderer.authorPhoto?.thumbnails[0].url ?? ''),
    alt: messageRenderer.authorName?.simpleText ?? ''
  };
  const channelId = renderer.authorExternalChannelId;

  const item: Ytc.ParsedMessage = {
    author: {
      // It's apparently possible for there to be no author name (and only an author photo).
      name: messageRenderer.authorName?.simpleText ?? '',
      id: renderer.authorExternalChannelId ?? '',
      types: authorTypes,
      customBadge,
      profileIcon
    },
    message: runs,
    timestamp: isReplay && timestampText != null ? timestampText : formatTimestamp(timestampUsec),
    showtime: isReplay ? liveTimeoutOrReplayMs : liveShowtimeMs,
    messageId: renderer.id,
    params: messageRenderer.contextMenuEndpoint?.liveChatItemContextMenuEndpoint.params
  };
  if (channelId != null) {
    item.author.url = `${currentDomain}/channel/${channelId}`;
  }

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
  } else if (isGiftPurchase) {
    const header = renderer.header.liveChatSponsorshipsHeaderRenderer;
    item.membershipGiftPurchase = {
      headerPrimaryText: parseMessageRuns(header.primaryText.runs),
      image: {
        src: fixUrl(header.image.thumbnails[0].url),
        alt: 'gift'
      }
    };
  } else if (actionItem.liveChatSponsorshipsGiftRedemptionAnnouncementRenderer) {
    item.membershipGiftRedeem = true;
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

const parsePollRenderer = (baseRenderer: Ytc.PollRenderer): Ytc.ParsedPoll | undefined => {
  if (!baseRenderer) {
    return;
  }
  const profileIcon = {
    src: fixUrl(baseRenderer.header.pollHeaderRenderer.thumbnail?.thumbnails[0].url ?? ''),
    alt: 'Poll profile icon'
  };
  // TODO implement 'selected' field? YT doesn't use it in results.
  return {
    type: 'poll',
    actionId: baseRenderer.liveChatPollId,
    item: {
      profileIcon: profileIcon,
      header: parseMessageRuns(baseRenderer.header.pollHeaderRenderer.metadataText.runs),
      question: parseMessageRuns(baseRenderer.header.pollHeaderRenderer.pollQuestion.runs),
      choices: baseRenderer.choices.map((choice) => {
        return {
          text: parseMessageRuns(choice.text.runs),
          selected: choice.selected,
          ratio: choice.voteRatio,
          percentage: choice.votePercentage?.simpleText
        };
      }),
    }
  };
}

const parseBannerAction = (action: Ytc.AddPinnedAction): Ytc.ParsedMisc | undefined => {
  const baseRenderer = action.bannerRenderer.liveChatBannerRenderer;

  // polls can come through banner or through update actions, send both to the same parser
  // actionId isn't needed as the pollRenderer contains liveChatPollId
  if (baseRenderer.contents.pollRenderer) {
    return parsePollRenderer(baseRenderer.contents.pollRenderer);
  }

  const actionId = baseRenderer.actionId;

  // fold both auto-disappear and auto-collapse into just collapse for showtime
  const showtime = action.bannerProperties?.isEphemeral
   ? (action.bannerProperties?.bannerTimeoutMs || 0)
   : 1000 * (action.bannerProperties?.autoCollapseDelay?.seconds || baseRenderer.bannerProperties?.autoCollapseDelay?.seconds || 0);

  if (baseRenderer.contents.liveChatBannerChatSummaryRenderer) {
    return parseChatSummary(baseRenderer.contents, actionId, showtime);
  }
  if (baseRenderer.contents.liveChatBannerRedirectRenderer) {
    return parseRedirectBanner(baseRenderer.contents, actionId, showtime);
  }
  const parsedContents = parseAddChatItemAction(
    { item: baseRenderer.contents }, true
  );
  if (!parsedContents) {
    return;
  }
  return {
    type: 'pin',
    actionId: actionId,
    item: {
      header: parseMessageRuns(
        baseRenderer.header.liveChatBannerHeaderRenderer.text.runs
      ),
      contents: parsedContents
    },
    showtime: showtime,
  };
};

const parseTickerAction = (action: Ytc.AddTickerAction, isReplay: boolean, liveTimeoutOrReplayMs: number): Ytc.ParsedTicker | undefined => {
  const baseRenderer = action.item.liveChatTickerPaidMessageItemRenderer ?? action.item.liveChatTickerSponsorItemRenderer;
  if (!baseRenderer) return;
  const parsedMessage = parseAddChatItemAction({
    item: baseRenderer.showItemEndpoint.showLiveChatItemEndpoint.renderer
  }, isReplay, liveTimeoutOrReplayMs);
  if (!parsedMessage) return;
  return {
    type: 'ticker',
    ...parsedMessage,
    tickerDuration: baseRenderer.fullDurationSec ?? baseRenderer.durationSec,
    detailText: 'detailText' in baseRenderer
      ? (
          'simpleText' in baseRenderer.detailText ? baseRenderer.detailText.simpleText : baseRenderer.detailText.runs[0].text
        )
      : undefined
  };
};

const processCommonAction = (
  action: Ytc.ReplayAction,
  isReplay: boolean,
  liveTimeoutOrReplayMs: number
): Ytc.ParsedTimedItem | Ytc.ParsedMisc | undefined => {
  if (action.addChatItemAction) {
    return parseAddChatItemAction(action.addChatItemAction, isReplay, liveTimeoutOrReplayMs);
  } else if (action.addBannerToLiveChatCommand) {
    return parseBannerAction(action.addBannerToLiveChatCommand);
  } else if (action.removeBannerForLiveChatCommand) {
    return {
      type: 'unpin',
      targetActionId: action.removeBannerForLiveChatCommand.targetActionId,
    } as Ytc.ParsedRemoveBanner;
  } else if (action.addLiveChatTickerItemAction) {
    return parseTickerAction(action.addLiveChatTickerItemAction, isReplay, liveTimeoutOrReplayMs);
  } else if (action.updateLiveChatPollAction) {
    return parsePollRenderer(action.updateLiveChatPollAction.pollToUpdate.pollRenderer);
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

const sortAction = (action: Ytc.ParsedAction, messageArray: Ytc.ParsedTimedItem[], bonkArray: Ytc.ParsedBonk[], deleteArray: Ytc.ParsedDeleted[], miscArray: Ytc.ParsedMisc[]): void => {
  if ('message' in action || 'tickerDuration' in action) {
    messageArray.push(action);
  } else if ('replacedMessage' in action && 'authorId' in action) {
    bonkArray.push(action);
  } else if ('replacedMessage' in action && 'messageId' in action) {
    deleteArray.push(action);
  } else {
    miscArray.push(action);
  }
};

const cheatTimestamps = (arr: Ytc.ParsedMessage[]): void => {
  const earliest = arr[0].showtime;
  const delta = Date.now() - earliest;
  arr.forEach(item => {
    item.showtime += delta;
  });
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

  const messageArray: Ytc.ParsedTimedItem[] = [];
  const bonkArray: Ytc.ParsedBonk[] = [];
  const deleteArray: Ytc.ParsedDeleted[] = [];
  const miscArray: Ytc.ParsedMisc[] = [];

  const liveTimeoutMs = 0;
  // base.continuations[0].timedContinuationData?.timeoutMs ??
  // base.continuations[0].invalidationContinuationData?.timeoutMs ?? 0;
  // NOTE: this used to be a thing, but it seems to have been removed.

  actionsArray.forEach((action) => {
    let parsedAction: Ytc.ParsedAction | undefined;

    try {
      if (action.replayChatItemAction) {
        const replayAction = action.replayChatItemAction;
        const replayTimeMs = parseInt(replayAction.videoOffsetTimeMsec);
        parsedAction = processCommonAction(replayAction.actions[0], isReplay, replayTimeMs);
      } else {
        parsedAction = processLiveAction(action, isReplay, liveTimeoutMs);
      }
    } catch (error) {
      console.error('Failed to parse action:', action);
      throw error;
    }

    if (!parsedAction) {
      console.debug('Unparsed action:', action);
      return;
    }
    sortAction(parsedAction, messageArray, bonkArray, deleteArray, miscArray);
  });

  const refresh = base.clientMessages != null;
  if (!isReplay && !refresh) cheatTimestamps(messageArray);

  return {
    messages: messageArray,
    bonks: bonkArray,
    deletions: deleteArray,
    miscActions: miscArray,
    isReplay,
    refresh
  };
};
