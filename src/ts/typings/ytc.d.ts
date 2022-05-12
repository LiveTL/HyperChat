/* eslint-disable no-use-before-define */
declare namespace Ytc {
  /*
   * Base JSON
   */
  /** Expected YTC JSON response */
  interface RawResponse {
    continuationContents?: {
      liveChatContinuation: BaseData;
    };
    /** Initial data only. */
    contents?: {
      liveChatRenderer: BaseData;
    };
  }

  interface BaseData {
    continuations: ContinuationData[];
    actions?: Action[];
    /** Only present on supposed YTC refresh, e.g. when toggling Top/Live Chat. */
    clientMessages?: unknown;
  }

  /** Expected YTC continuation data object */
  interface ContinuationData {
    timedContinuationData?: {
      timeoutMs: number;
    };
    invalidationContinuationData?: {
      timeoutMs: number;
    };
  }

  interface ReplayAction {
    addChatItemAction?: AddChatItemAction;
    addBannerToLiveChatCommand?: AddPinnedAction;
    removeBannerForLiveChatCommand?: unknown;
    addLiveChatTickerItemAction?: AddTickerAction;
  }

  /** Expected YTC action object */
  interface Action extends ReplayAction {
    replayChatItemAction?: ReplayChatItemAction;
    markChatItemsByAuthorAsDeletedAction?: AuthorBonkedAction;
    markChatItemAsDeletedAction?: MessageDeletedAction;
  }

  /*
   * Actions
   */
  /** YTC addChatItemAction object */
  interface AddChatItemAction {
    item: AddChatItem;
  }

  /** YTC replayChatItemAction object */
  interface ReplayChatItemAction {
    actions: ReplayAction[];
    videoOffsetTimeMsec: IntString;
  }

  /* YTC sentChatItemAction object */
  interface SentChatItemAction {
    actions: Action[];
  }

  /** YTC markChatItemsByAuthorAsDeletedAction object */
  interface AuthorBonkedAction extends IDeleted {
    /** ID of channel that was bonked */
    externalChannelId: string;
  }

  /** YTC markChatItemAsDeletedAction object. */
  interface MessageDeletedAction extends IDeleted {
    /** ID of message to be deleted */
    targetItemId: string;
  }

  /** YTC addBannerToLiveChatCommand object */
  interface AddPinnedAction {
    bannerRenderer: {
      liveChatBannerRenderer: {
        contents: AddChatItem;
        header: {
          liveChatBannerHeaderRenderer: {
            text: RunsObj;
          };
        };
      };
    };
  }

  interface AddTickerAction {
    item: {
      liveChatTickerSponsorItemRenderer?: TickerRenderer & {
        detailText: RunsObj;
        detailTextColor: number;
      };
      liveChatTickerPaidMessageItemRenderer?: TickerRenderer & {
        amount: SimpleTextObj;
        amountTextColor: number;
      };
    };
    durationSec: IntString;
  }

  /*
   * Misc
   */
  interface Thumbnails {
    thumbnails: Array<{
      url: string;
      width?: number;
      height?: number;
    }>;
  }

  interface ThumbnailsWithLabel extends Thumbnails {
    accessibility?: {
      accessibilityData: {
        label: string;
      };
    };
  }

  /** Message run object */
  interface MessageRun {
    text?: string;
    navigationEndpoint?: {
      commandMetadata: {
        webCommandMetadata: {
          url: string;
        };
      };
    };
    emoji?: {
      emojiId?: string;
      image: ThumbnailsWithLabel;
    };
  }

  interface TextMessageRenderer {
    message?: RunsObj;
    authorExternalChannelId?: string;
    authorName?: SimpleTextObj;
    authorPhoto?: Thumbnails;
    authorBadges?: Array<{
      liveChatAuthorBadgeRenderer: {
        /** Changes based on YT language */
        tooltip: string;
        /** Used to check if author is member ignoring YT language */
        customThumbnail?: Thumbnails;
        /** Only available for verified, mods and owner */
        icon?: {
          /** Unlocalized string */
          iconType: string;
        };
        accessibility?: {
          accessibilityData: {
            label: string;
          };
        };
      };
    }>;
    id: string;
    timestampUsec: IntString;
    authorExternalChannelId: string;
    /** Only available on replays */
    timestampText?: SimpleTextObj;
  }

  interface PaidRenderer extends TextMessageRenderer {
    purchaseAmountText: SimpleTextObj;
    authorNameTextColor: number;
  }

  interface PaidMessageRenderer extends PaidRenderer {
    headerBackgroundColor: number;
    headerTextColor: number;
    bodyBackgroundColor: number;
    bodyTextColor: number;
  }

  interface PaidStickerRenderer extends PaidRenderer {
    sticker: ThumbnailsWithLabel;
    moneyChipBackgroundColor: number;
    moneyChipTextColor: number;
  }

  interface MembershipRenderer extends TextMessageRenderer {
    headerPrimaryText?: RunsObj;
    headerSubtext: SimpleTextObj | RunsObj;
  }

  interface PlaceholderRenderer { // No idea what the purpose of this is
    id: string;
    timestampUsec: IntString;
  }

  type Renderers = TextMessageRenderer | PaidMessageRenderer |
  PaidStickerRenderer | MembershipRenderer;

  interface AddChatItem {
    liveChatTextMessageRenderer?: TextMessageRenderer;
    liveChatPaidMessageRenderer?: PaidMessageRenderer;
    liveChatPaidStickerRenderer?: PaidStickerRenderer;
    liveChatMembershipItemRenderer?: MembershipRenderer;
    liveChatPlaceholderItemRenderer?: PlaceholderRenderer;
  }

  interface TickerRenderer { // Doesn't have a timestamp but ID is always a paid message id
    id: string;
    startBackgroundColor: number;
    endBackgroundColor: number;
    durationSec: number;
    fullDurationSec: number;
  }

  interface IDeleted {
    /** Message to replace deleted messages. */
    deletedStateMessage: RunsObj;
  }

  /** Integer formatted as string for whatever reason */
  type IntString = string;

  interface SimpleTextObj {
    simpleText: string;
  }

  interface RunsObj {
    runs: MessageRun[];
  }

  /*
   * Parsed objects
   */
  interface ParsedImage {
    src: string;
    alt: string;
  }

  interface ParsedTextRun {
    type: 'text';
    text: string;
  }

  interface ParsedLinkRun {
    type: 'link';
    text: string;
    url: string;
  }

  interface ParsedEmojiRun extends ParsedImage {
    type: 'emoji';
    standardEmoji?: boolean;
  }

  type ParsedRun = ParsedTextRun | ParsedLinkRun | ParsedEmojiRun;

  interface PaidDetails {
    amount: string;
    bodyBackgroundColor: string;
    bodyTextColor: string;
    nameColor: string;
  }

  interface ParsedSuperChat extends PaidDetails {
    headerBackgroundColor: string;
    headerTextColor: string;
  }

  interface ParsedSuperSticker extends PaidDetails, ParsedImage { }

  interface ParsedMembership {
    headerPrimaryText: ParsedRun[];
    headerSubtext: ParsedRun[];
  }

  interface ParsedMessage {
    author: {
      name: string;
      id: string;
      types: string[];
      profileIcon: ParsedImage;
      customBadge?: ParsedImage;
      url?: string;
    };
    message: ParsedRun[];
    timestamp: string;
    showtime: number;
    messageId: string;
    superChat?: ParsedSuperChat;
    superSticker?: ParsedSuperSticker;
    membership?: ParsedMembership;
  }

  interface ParsedBonk {
    replacedMessage: ParsedRun[];
    authorId: string;
  }

  interface ParsedDeleted {
    replacedMessage: ParsedRun[];
    messageId: string;
  }

  interface ParsedPinned {
    type: 'pin';
    item: {
      header: ParsedRun[];
      contents: ParsedMessage;
    };
  }

  type ParsedMisc = ParsedPinned | { type: 'unpin'};

  type ParsedAction = ParsedMessage | ParsedBonk | ParsedDeleted | ParsedMisc;

  interface ParsedChunk {
    messages: ParsedMessage[];
    bonks: ParsedBonk[];
    deletions: ParsedDeleted[];
    miscActions: ParsedMisc[];
    isReplay: boolean;
    refresh: boolean;
  }
}
