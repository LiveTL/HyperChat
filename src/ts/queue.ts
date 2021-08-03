import { writable, Writable } from 'svelte/store';

type QueueItem<T> = { data: T, next?: QueueItem<T> };

export class Queue<T> {
  private _first?: QueueItem<T>;
  private _last?: QueueItem<T>;

  constructor () {
    this.clear();
  }

  get front (): T | undefined {
    return this._first?.data;
  }

  clear (): void {
    this._first = undefined;
    this._last = undefined;
  }

  pop (): T | undefined {
    const oldFront = this._first;
    this._first = oldFront?.next;
    if (oldFront === this._last) {
      this._last = undefined;
    }
    return oldFront?.data;
  }

  push (item: T): void {
    const newItem = { data: item };
    if (!this._last) {
      this._first = newItem;
      this._last = this._first;
    } else {
      this._last.next = newItem;
      this._last = newItem;
    }
  }
}

type WelcomeMessage = { welcomeMessage?: boolean };
export type YtcQueueMessage = Chat.Message | WelcomeMessage;

export const isChatMessage =
  (message: YtcQueueMessage):message is Chat.Message =>
    (message as WelcomeMessage).welcomeMessage == null;

export class YtcQueue {
  private _queue: Queue<Chat.Message>;
  private _previousTime: number;
  private _messages: YtcQueueMessage[];
  private _historySize?: number;
  private _isReplay: boolean;
  private _livePolling?: NodeJS.Timeout;
  private _newMessageCondition?: () => boolean
  readonly messagesStore: Writable<YtcQueueMessage[]>;

  constructor (historySize?: number, isReplay = false, newMessageCondition?: () => boolean) {
    this._queue = new Queue();
    this._previousTime = 0;
    this._messages = [];
    this._historySize = historySize;
    this._isReplay = isReplay;
    this._newMessageCondition = newMessageCondition;
    this.messagesStore = writable(this._messages);
  }

  /**
   * Push message into the `_messages` array and the `messagesStore` Writable.
   * Will also remove old messages if `_historySize` was set.
   */
  private newMessage (message: YtcQueueMessage) {
    this._messages.push(message);
    if (
      this._historySize != null &&
      this._messages.length > this._historySize
    ) {
      this._messages.splice(0, 1);
    }
    this.messagesStore.set(this._messages);
  }

  /**
   * Continuosly pushes queue messages to store until queue is empty or until
   * `extraCondition` returns false.
   */
  private pushQueueToStore (
    extraCondition: (queue: Queue<Chat.Message>) => boolean
  ) {
    while (this._queue.front && extraCondition(this._queue)) {
      const message = this._queue.pop();
      if (!message) return;
      if (!this._newMessageCondition) {
        this.newMessage(message);
        return;
      }
      if (this._newMessageCondition()) {
        this.newMessage(message);
      }
    }
  }

  private isScrubbedOrSkipped (time: number) {
    return time == null || Math.abs(this._previousTime - time) > 1;
  }

  /**
   * Push all queued messages to store.
   */
  private pushAllQueuedToStore () {
    this.pushQueueToStore(() => true);
  }

  /**
   * Push messages up till the currentTime to store.
   */
  private pushTillCurrentToStore (currentTimeMs: number) {
    this.pushQueueToStore((q) => {
      const frontShowtime = q.front?.showtime;
      if (frontShowtime == null) return false;
      return (frontShowtime / 1000) <= currentTimeMs;
    });
  }

  /**
   * Called when the video progresses to push queued messages to store.
   */
  private onVideoProgress (timeMs: number) {
    if (timeMs < 0) return;
    if (this.isScrubbedOrSkipped(timeMs)) {
      this.pushAllQueuedToStore();
    } else {
      this.pushTillCurrentToStore(timeMs);
    }
    this._previousTime = timeMs;
  }

  /**
   * Sets video progress to current time in seconds.
   * Normally called by the live polling interval that runs every 250 ms.
   */
  private updateLiveProgress () {
    this.onVideoProgress(Date.now() / 1000);
  }

  /**
   * Checks if `message` can be found in either of `bonks` or `deletions`.
   * If it is, its message will be replaced and marked as deleted.
   */
  private processDeleted (
    message: YtcQueueMessage,
    bonks: Ytc.ParsedBonk[],
    deletions: Ytc.ParsedDeleted[]
  ) {
    if (!isChatMessage(message)) return;
    for (const b of bonks) {
      if (message.author.id !== b.authorId) continue;
      message.message = b.replacedMessage;
      message.deleted = true;
      return;
    }
    for (const d of deletions) {
      if (message.messageId !== d.messageId) continue;
      message.message = d.replacedMessage;
      message.deleted = true;
      return;
    }
  }

  /**
   * Add messages from actionChunk to the queue.
   * Also handles author bonks and message deletions.
   */
  private addToQueue (chunk: Chat.ParsedChunk) {
    const messages = chunk.messages;
    const bonks = chunk.bonks;
    const deletions = chunk.deletions;

    messages.sort((m1, m2) => m1.showtime - m2.showtime).forEach((m) => {
      this.processDeleted(m, bonks, deletions);
      this._queue.push(m);
    });

    this._messages.forEach((m) => this.processDeleted(m, bonks, deletions));
  }

  /**
   * Add initial data to queue.
   */
  addInitialData (initialData: Chat.InitialDataChunk): void {
    this.addToQueue(initialData);
    this.pushAllQueuedToStore();
    this.newMessage({ welcomeMessage: true });

    if (!this._livePolling && !this._isReplay) {
      this._livePolling = setInterval(() => this.updateLiveProgress(), 250);
      this.updateLiveProgress();
    }
  }

  /**
   * Add action chunk to queue.
   */
  addActionChunk (actionChunk: Chat.ActionChunk): void {
    this.addToQueue(actionChunk);
  }

  /**
   * Update player progress to given time.
   * Only effective on VODs.
   */
  updatePlayerProgress (timeMs: number): void {
    if (this._livePolling || this._isReplay) return;
    this.onVideoProgress(timeMs);
  }

  /**
   * Perform cleanup actions such as clearing live polling interval.
   */
  cleanUp (): void {
    if (!this._livePolling) return;
    clearInterval(this._livePolling);
  }
}
