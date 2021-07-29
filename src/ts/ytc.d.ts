/* eslint-disable no-use-before-define */
declare namespace Ytc {
  /**
   * Base JSON
   */
  /** Expected YTC JSON response */
  type RawResponse = {
    continuationContents?: {
      liveChatContinuation: BaseData;
    };
    /** Initial data only. */
    contents?: {
      liveChatRenderer: BaseData;
    };
  };

  type BaseData = {
    continuations: ContinuationData[];
    actions?: Action[];
  };

  /** Expected YTC continuation data object */
  type ContinuationData = {
    timedContinuationData?: {
      timeoutMs: number;
    };
    invalidationContinuationData?: {
      timeoutMs: number;
    }
  };

  /** Expected YTC action object */
  type Action = {
    addChatItemAction?: AddChatItemAction;
    replayChatItemAction?: ReplayChatItemAction;
    markChatItemsByAuthorAsDeletedAction?: AuthorBonkedAction;
    markChatItemAsDeletedAction?: MessageDeletedAction;
    addBannerToLiveChatCommand?: AddPinnedAction;
    removeBannerForLiveChatCommand?;
  };

  /**
   * Actions
   */
  /** YTC addChatItemAction object */
  type AddChatItemAction = {
    item: AddChatItem;
  };

  /** YTC replayChatItemAction object */
  type ReplayChatItemAction = {
    actions: Action[];
    videoOffsetTimeMsec: IntString;
  };

  /** YTC markChatItemsByAuthorAsDeletedAction object */
  type AuthorBonkedAction = IDeleted & {
    /** ID of channel that was bonked */
    externalChannelId: string;
  };

  /** YTC markChatItemAsDeletedAction object. */
  type MessageDeletedAction = IDeleted & {
    /** ID of message to be deleted */
    targetItemId: string;
  };

  /** YTC addBannerToLiveChatCommand object */
  type AddPinnedAction = {
    bannerRenderer: {
      liveChatBannerRenderer: {
        contents: AddChatItem;
        header: {
          liveChatBannerHeaderRenderer: {
            text: {
              runs: MessageRun[];
            }
          }
        }
      }
    }
  };

  /**
   * Misc
   */
  /** Message run object */
  type MessageRun ={
    text?: string;
    navigationEndpoint?: {
      commandMetadata: {
        webCommandMetadata: {
          url: string;
        };
      };
    };
    emoji?: {
      image: {
        thumbnails: {
          url: string
        }[];
      };
    };
  };

  type TextMessageRenderer = {
    message: {
      runs: MessageRun[];
    };
    authorName: SimpleTextObj;
    authorBadges?: {
      liveChatAuthorBadgeRenderer: {
        /** Changes based on YT language */
        tooltip: string;
        /** Used to check if author is member ignoring YT language */
        customThumbnail?;
        /** Only available for verified, mods and owner */
        icon?: {
          /** Unlocalized string */
          iconType: string;
        };
      };
    }[];
    id: string;
    timestampUsec: IntString;
    authorExternalChannelId: string;
    /** Only available on replays */
    timestampText?: SimpleTextObj;
  };

  type PaidMessageRenderer = TextMessageRenderer & {
    purchaseAmountText: SimpleTextObj;
    bodyBackgroundColor: number
  };

  type PaidStickerRenderer = TextMessageRenderer & {
    sticker: {
      thumbnails: {
        url: string
      }[];
    };
    purchaseAmountText: SimpleTextObj;
    moneyChipBackgroundColor: number;
  };

  type AddChatItem = {
    liveChatTextMessageRenderer?: TextMessageRenderer;
    liveChatPaidMessageRenderer?: PaidMessageRenderer;
    liveChatPaidStickerRenderer?: PaidStickerRenderer;
  };

  type IDeleted = {
    /** Message to replace deleted messages. */
    deletedStateMessage: {
      runs: MessageRun[];
    };
  };

  /** Integer formatted as string for whatever reason */
  type IntString = string;

  type SimpleTextObj = {
    simpleText: string;
  };

  type ParsedRun = {
    type: 'link' | 'text' | 'emote';
    text?: string;
    url?: string;
    src?: string;
  };

  type ParsedMessage = {
    author: {
      name: string;
      id: string;
      types: string[];
    };
    message: ParsedRun[];
    timestamp: string;
    showtime: number;
    messageId: string;
    superchat?: {
      amount: string;
      color: string;
    }
  };

  type ParsedBonk = {
    replacedMessage: ParsedRun[]
    authorId: string;
  };

  type ParsedDeleted = {
    replacedMessage: ParsedRun[];
    messageId: string;
  };

  type ParsedPinned = {
    header: ParsedRun[];
    contents: ParsedMessage;
  };

  type ParsedMisc<T> = {
    type: string;
    item?: T;
  };
}
