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
  type MessageRun = {
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
    message?: {
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

  type PaidRenderer = TextMessageRenderer & {
    purchaseAmountText: SimpleTextObj;
    authorNameTextColor: number;
  };

  type PaidMessageRenderer = PaidRenderer & {
    headerBackgroundColor: number,
    headerTextColor: number,
    bodyBackgroundColor: number,
    bodyTextColor: number,
  };

  type PaidStickerRenderer = PaidRenderer & {
    sticker: {
      thumbnails: {
        url: string
      }[];
    };
    moneyChipBackgroundColor: number;
    moneyChipTextColor: number
  };

  type MembershipRenderer = TextMessageRenderer & {
    headerSubtext: {
      runs: MessageRun[];
    };
  };

  type AddChatItem = {
    liveChatTextMessageRenderer?: TextMessageRenderer;
    liveChatPaidMessageRenderer?: PaidMessageRenderer;
    liveChatPaidStickerRenderer?: PaidStickerRenderer;
    liveChatMembershipItemRenderer?: MembershipRenderer;
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

  type ParsedTextRun = {
    type: 'text';
    text: string;
  };

  type ParsedLinkRun = {
    type: 'link';
    text: string;
    url: string;
  };

  type ParsedEmoteRun = {
    type: 'emote';
    src: string;
  };

  type ParsedRun = ParsedTextRun | ParsedLinkRun | ParsedEmoteRun;

  type PaidDetails = {
    amount: string;
    backgroundColor: string;
    textColor: string;
    nameColor: string;
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
    superChat?: PaidDetails;
    superSticker?: PaidDetails & {
      src: string;
    };
    membership?: boolean;
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
    type: 'messagePinned';
    item: {
      header: ParsedRun[];
      contents: ParsedMessage;
    }
  };

  type ParsedMisc = ParsedPinned | { type: 'removePinned'}

  type Renderers = TextMessageRenderer | PaidMessageRenderer | PaidStickerRenderer | MembershipRenderer;
}
