import { writable, Writable } from 'svelte/store';

interface QueueItem<T> { data: T, next?: QueueItem<T> }

export class Queue<T> {
  private _first?: QueueItem<T>;
  private _last?: QueueItem<T>;

  constructor() {
    this.clear();
  }

  get front(): T | undefined {
    return this._first?.data;
  }

  clear(): void {
    this._first = undefined;
    this._last = undefined;
  }

  pop(): T | undefined {
    const oldFront = this._first;
    this._first = oldFront?.next;
    if (oldFront === this._last) {
      this._last = undefined;
    }
    return oldFront?.data;
  }

  push(item: T): void {
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

export class YtcQueue {
  private readonly _messageQueue: Queue<Chat.MessageAction>;
  private _previousTime: number;
  private readonly _isReplay: boolean;
  private readonly _livePolling?: NodeJS.Timeout;
  readonly latestAction: Writable<Chat.Actions | null>;
  initialData: Chat.Actions[];

  constructor(isReplay = false) {
    this._messageQueue = new Queue();
    this._previousTime = 0;
    this._isReplay = isReplay;
    this.latestAction = writable(null);
    this.initialData = [];

    if (!this._livePolling && !isReplay) {
      this._livePolling = setInterval(() => this.updateLiveProgress(), 250);
      this.updateLiveProgress();
    }
  }

  /**
   * Sets video progress to current time in seconds.
   * Normally called by the live polling interval that runs every 250 ms.
   */
  private updateLiveProgress(): void {
    this.onVideoProgress(Date.now() / 1000);
  }

  /**
   * Continuosly pushes queue messages to store until queue is empty or until
   * `extraCondition` returns false.
   */
  private pushQueueToStore(
    extraCondition: (queue: Queue<Chat.MessageAction>) => boolean
  ): void {
    while (this._messageQueue.front && extraCondition(this._messageQueue)) {
      const message = this._messageQueue.pop();
      if (!message) return;
      this.latestAction.set(message);
    }
  }

  private isScrubbedOrSkipped(time: number): boolean {
    return time == null || Math.abs(this._previousTime - time) > 1;
  }

  /**
   * Push all queued messages to store.
   */
  private pushAllQueuedToStore(): void {
    this.pushQueueToStore(() => true);
  }

  /**
   * Push messages up till the currentTime to store.
   */
  private pushTillCurrentToStore(currentTimeMs: number): void {
    this.pushQueueToStore((q) => {
      const frontShowtime = q.front?.message.showtime;
      if (frontShowtime == null) return false;
      return (frontShowtime / 1000) <= currentTimeMs;
    });
  }

  /**
   * Called when the video progresses to push queued messages to store.
   */
  private onVideoProgress(timeMs: number): void {
    if (timeMs < 0) return;
    if (this.isScrubbedOrSkipped(timeMs)) {
      this.pushAllQueuedToStore();
    } else {
      this.pushTillCurrentToStore(timeMs);
    }
    this._previousTime = timeMs;
  }

  /**
   * Checks if `message` can be found in either of `bonks` or `deletions`.
   * If it is, its message will be replaced and marked as deleted.
   */
  private processDeleted(
    messageAction: Chat.MessageAction,
    bonks: Ytc.ParsedBonk[],
    deletions: Ytc.ParsedDeleted[]
  ): void {
    const message = messageAction.message;
    for (const b of bonks) {
      if (message.author.id !== b.authorId) continue;
      messageAction.deleted = { replace: b.replacedMessage };
      return;
    }
    for (const d of deletions) {
      if (message.messageId !== d.messageId) continue;
      messageAction.deleted = { replace: d.replacedMessage };
      return;
    }
  }

  /**
   * Processes actionChunk.
   * Adds messages to the queue, handles author bonks, message deletions
   * and pinned messages.
   */
  addActionChunk(chunk: Ytc.ParsedChunk, setInitial = false): void {
    const messages = chunk.messages;
    const bonks = chunk.bonks;
    const deletions = chunk.deletions;
    const misc = chunk.miscActions;

    const messageActions =
      messages.sort((m1, m2) => m1.showtime - m2.showtime).map((m) => {
        const messageAction: Chat.MessageAction = {
          type: 'message',
          message: m
        };
        this.processDeleted(messageAction, bonks, deletions);
        if (!setInitial) this._messageQueue.push(messageAction);
        return messageAction;
      });

    if (setInitial) {
      this.initialData = [...messageActions, ...misc];
      return;
    }

    bonks.forEach((bonk) => this.latestAction.set({ type: 'bonk', bonk }));
    deletions.forEach((deletion) => this.latestAction.set({ type: 'delete', deletion }));
    misc.forEach((action) => this.latestAction.set(action));
  }

  /**
   * Update player progress to given time.
   * Only effective on VODs.
   */
  updatePlayerProgress(timeMs: number): void {
    this.latestAction.set({ type: 'playerProgress', playerProgress: timeMs });
    if (this._livePolling || !this._isReplay) return;
    this.onVideoProgress(timeMs);
  }

  /**
   * Perform cleanup actions such as clearing live polling interval.
   */
  cleanUp(): void {
    if (!this._livePolling) return;
    clearInterval(this._livePolling);
  }
}
