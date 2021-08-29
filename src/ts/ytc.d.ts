/* eslint-disable no-use-before-define */
declare namespace Ytc {
  /*
   * Base JSON
   */
  /** Expected YTC JSON response */
  interface RawResponse {
    continuationContents?: {
      liveChatContinuation: BaseData
    }
    /** Initial data only. */
    contents?: {
      liveChatRenderer: BaseData
    }
  }

  interface BaseData {
    continuations: ContinuationData[]
    actions?: Action[]
  }

  /** Expected YTC continuation data object */
  interface ContinuationData {
    timedContinuationData?: {
      timeoutMs: number
    }
    invalidationContinuationData?: {
      timeoutMs: number
    }
  }

  interface ReplayAction {
    addChatItemAction?: AddChatItemAction
    addBannerToLiveChatCommand?: AddPinnedAction
    removeBannerForLiveChatCommand?: unknown
    addLiveChatTickerItemAction?: AddTickerAction
  }

  /** Expected YTC action object */
  type Action = ReplayAction & {
    replayChatItemAction?: ReplayChatItemAction
    markChatItemsByAuthorAsDeletedAction?: AuthorBonkedAction
    markChatItemAsDeletedAction?: MessageDeletedAction
  };

  /*
   * Actions
   */
  /** YTC addChatItemAction object */
  interface AddChatItemAction {
    item: AddChatItem
  }

  /** YTC replayChatItemAction object */
  interface ReplayChatItemAction {
    actions: ReplayAction[]
    videoOffsetTimeMsec: IntString
  }

  /** YTC markChatItemsByAuthorAsDeletedAction object */
  type AuthorBonkedAction = IDeleted & {
    /** ID of channel that was bonked */
    externalChannelId: string
  };

  /** YTC markChatItemAsDeletedAction object. */
  type MessageDeletedAction = IDeleted & {
    /** ID of message to be deleted */
    targetItemId: string
  };

  /** YTC addBannerToLiveChatCommand object */
  interface AddPinnedAction {
    bannerRenderer: {
      liveChatBannerRenderer: {
        contents: AddChatItem
        header: {
          liveChatBannerHeaderRenderer: {
            text: {
              runs: MessageRun[]
            }
          }
        }
      }
    }
  }

  interface AddTickerAction {
    item: {
      liveChatTickerSponsorItemRenderer?: TickerRenderer & {
        detailText: {
          runs: MessageRun[]
        }
        detailTextColor: number
      }
      liveChatTickerPaidMessageItemRenderer?: TickerRenderer & {
        amount: SimpleTextObj
        amountTextColor: number
      }
    }
    durationSec: IntString
  }

  /*
   * Misc
   */
  interface ThumbnailsWithLabel {
    thumbnails: Array<{
      url: string
      width?: number
      height?: number
    }>
    accessibility?: {
      accessibilityData: {
        label: string
      }
    }
  }

  /** Message run object */
  interface MessageRun {
    text?: string
    navigationEndpoint?: {
      commandMetadata: {
        webCommandMetadata: {
          url: string
        }
      }
    }
    emoji?: {
      image: ThumbnailsWithLabel
    }
  }

  interface TextMessageRenderer {
    message?: {
      runs: MessageRun[]
    }
    authorName: SimpleTextObj
    authorBadges?: Array<{
      liveChatAuthorBadgeRenderer: {
        /** Changes based on YT language */
        tooltip: string
        /** Used to check if author is member ignoring YT language */
        customThumbnail?: {
          thumbnails: Array<{
            url: string
          }>
        }
        /** Only available for verified, mods and owner */
        icon?: {
          /** Unlocalized string */
          iconType: string
        }
      }
    }>
    id: string
    timestampUsec: IntString
    authorExternalChannelId: string
    /** Only available on replays */
    timestampText?: SimpleTextObj
  }

  type PaidRenderer = TextMessageRenderer & {
    purchaseAmountText: SimpleTextObj
    authorNameTextColor: number
  };

  type PaidMessageRenderer = PaidRenderer & {
    headerBackgroundColor: number
    headerTextColor: number
    bodyBackgroundColor: number
    bodyTextColor: number
  };

  type PaidStickerRenderer = PaidRenderer & {
    sticker: ThumbnailsWithLabel
    moneyChipBackgroundColor: number
    moneyChipTextColor: number
  };

  type MembershipRenderer = TextMessageRenderer & {
    headerSubtext: {
      runs: MessageRun[]
    }
  };

  interface PlaceholderRenderer { // No idea what the purpose of this is
    id: string
    timestampUsec: IntString
  }

  type Renderers = TextMessageRenderer | PaidMessageRenderer |
  PaidStickerRenderer | MembershipRenderer;

  interface AddChatItem {
    liveChatTextMessageRenderer?: TextMessageRenderer
    liveChatPaidMessageRenderer?: PaidMessageRenderer
    liveChatPaidStickerRenderer?: PaidStickerRenderer
    liveChatMembershipItemRenderer?: MembershipRenderer
    liveChatPlaceholderItemRenderer?: PlaceholderRenderer
  }

  interface TickerRenderer { // Doesn't have a timestamp but ID is always a paid message id
    id: string
    startBackgroundColor: number
    endBackgroundColor: number
    durationSec: number
    fullDurationSec: number
  }

  interface IDeleted {
    /** Message to replace deleted messages. */
    deletedStateMessage: {
      runs: MessageRun[]
    }
  }

  /** Integer formatted as string for whatever reason */
  type IntString = string;

  interface SimpleTextObj {
    simpleText: string
  }

  /*
   * Parsed objects
   */
  interface ParsedTextRun {
    type: 'text'
    text: string
  }

  interface ParsedLinkRun {
    type: 'link'
    text: string
    url: string
  }

  interface ParsedEmojiRun {
    type: 'emoji'
    src: string
    alt?: string
  }

  type ParsedRun = ParsedTextRun | ParsedLinkRun | ParsedEmojiRun;

  interface PaidDetails {
    amount: string
    bodyBackgroundColor: string
    bodyTextColor: string
    nameColor: string
  }

  type ParsedSuperChat = PaidDetails & {
    headerBackgroundColor: string
    headerTextColor: string
  };

  type ParsedSuperSticker = PaidDetails & {
    src: string
    alt?: string
  };

  interface ParsedMessage {
    author: {
      name: string
      id: string
      types: string[]
    }
    message: ParsedRun[]
    timestamp: string
    showtime: number
    messageId: string
    superChat?: ParsedSuperChat
    superSticker?: ParsedSuperSticker
    membership?: boolean
  }

  interface ParsedBonk {
    replacedMessage: ParsedRun[]
    authorId: string
  }

  interface ParsedDeleted {
    replacedMessage: ParsedRun[]
    messageId: string
  }

  interface ParsedPinned {
    type: 'pin'
    item: {
      header: ParsedRun[]
      contents: ParsedMessage
    }
  }

  type ParsedMisc = ParsedPinned | { type: 'unpin'};

  type ParsedAction = ParsedMessage | ParsedBonk | ParsedDeleted | ParsedMisc;

  interface ParsedChunk {
    messages: ParsedMessage[]
    bonks: ParsedBonk[]
    deletions: ParsedDeleted[]
    miscActions: ParsedMisc[]
    isReplay: boolean
  }
}
