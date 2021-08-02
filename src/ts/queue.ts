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

export class YtcQueue {
  private _queue: Queue<Chat.Message>;
  private _previousTime: number;
  private _messages: Chat.Message[];
  private _historySize?: number;
  messagesStore: Writable<Chat.Message[]>;

  constructor (historySize?: number) {
    this._queue = new Queue();
    this._previousTime = 0;
    this._messages = [];
    this._historySize = historySize;
    this.messagesStore = writable(this._messages);
  }

  private isScrubbedOrSkipped (time: number) {
    return time == null || Math.abs(this._previousTime - time) > 1;
  }

  private processDeleted (
    message: Chat.Message,
    bonks: Ytc.ParsedBonk[],
    deletions: Ytc.ParsedDeleted[]
  ) {
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

  private newMessage (message: Chat.Message) {
    this._messages.push(message);
    if (
      this._historySize != null &&
      this._messages.length > this._historySize
    ) {
      this._messages.splice(0, 1);
    }
    this.messagesStore.set(this._messages);
  }

  private pushQueueToStore (
    extraCondition: (queue: Queue<Chat.Message>) => boolean
  ) {
    while (this._queue.front && extraCondition(this._queue)) {
      const message = this._queue.pop();
      if (!message) return;
      this.newMessage(message);
    }
  }

  private pushAllQueuedToStore () {
    this.pushQueueToStore(() => true);
  }

  private pushTillCurrentToStore (currentTime: number) {
    this.pushQueueToStore((q) => {
      const frontShowtime = q.front?.showtime;
      if (frontShowtime == null) return false;
      return frontShowtime <= currentTime;
    });
  }

  updateVideoProgress (time: number): void {
    if (time < 0) return;
    if (this.isScrubbedOrSkipped(time)) {
      this.pushAllQueuedToStore();
    } else {
      this.pushTillCurrentToStore(time);
    }
    this._previousTime = time;
  }

  addToQueue (actionChunk: Chat.ActionChunk): void {
    const messages = actionChunk.messages;
    const bonks = actionChunk.bonks;
    const deletions = actionChunk.deletions;

    messages.sort((m1, m2) => m1.showtime - m2.showtime).forEach((m) => {
      this.processDeleted(m, bonks, deletions);
      this._queue.push(m);
    });

    this._messages.forEach((m) => this.processDeleted(m, bonks, deletions));
  }
}
