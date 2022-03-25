import { parseChatResponse } from './chat-parser';

interface QueueItem<T> { data: T, next?: QueueItem<T> }
export interface Queue<T> {
  clear: () => void;
  front: () => T | undefined;
  pop: () => T | undefined;
  push: (item: T) => void;
}

export function queue<T>(): Queue<T> {
  let first: QueueItem<T> | undefined;
  let last: QueueItem<T> | undefined;

  const clear = (): void => {
    first = undefined;
    last = undefined;
  };

  const front = (): T | undefined => {
    return first?.data;
  };

  const pop = (): T | undefined => {
    const oldFront = first;
    first = oldFront?.next;
    if (oldFront === last) {
      last = undefined;
    }
    return oldFront?.data;
  };

  const push = (item: T): void => {
    const newItem = { data: item };
    if (!last) {
      first = newItem;
      last = first;
    } else {
      last.next = newItem;
      last = newItem;
    }
  };

  return { clear, front, pop, push };
}

type Callback<T> = (t: T) => void;
export type Unsubscriber = () => void;
export interface Subscribable<T> {
  set: (value: T) => void;
  get: () => T;
  subscribe: (callback: Callback<T>) => Unsubscriber;
}

export function subscribable<T>(): Subscribable<T> {
  const subscribers: Map<number, Callback<T>> = new Map();
  let count = 0;
  let value: T;

  const set = (newValue: T): void => {
    value = newValue;
    subscribers.forEach((cb) => cb(newValue));
  };

  const get = (): T => value;

  const subscribe = (callback: Callback<T>): Unsubscriber => {
    callback(value);
    const id = count;
    subscribers.set(id, callback);
    count++;

    return () => subscribers.delete(id);
  };

  return { set, get, subscribe };
}

type QueueCondition = (queue: Queue<Chat.MessageAction>) => boolean;
export interface YtcQueue {
  latestAction: Subscribable<Chat.Actions | null>;
  getInitialData: () => Chat.Actions[];
  addJsonToQueue: (json: string, isInitial: boolean, interceptor: Chat.Interceptor) => void;
  updatePlayerProgress: (timeMs: number) => void;
  cleanUp: () => void;
  selfChannel: Subscribable<Ytc.TextMessageRenderer | null>;
  addActionChunk: (chunk: Ytc.ParsedChunk, setInitial?: boolean, forceDisplay?: boolean) => void;
}

export function ytcQueue(isReplay = false): YtcQueue {
  const messageQueue = queue<Chat.MessageAction>();
  let previousTime = 0;
  let livePolling: number | undefined;

  const latestAction = subscribable<Chat.Actions | null>();
  let initialData: Chat.Actions[] = [];
  // eslint-disable-next-line prefer-const
  let selfChannel = subscribable<Ytc.TextMessageRenderer | null>();

  /**
   * Continuously pushes queue messages to store until queue is empty or until
   * `extraCondition` returns false.
   */
  const pushQueueToStore = (extraCondition: QueueCondition): void => {
    const messages: Chat.MessageAction[] = [];
    while (messageQueue.front() && extraCondition(messageQueue)) {
      const message = messageQueue.pop();
      if (!message) return;
      messages.push(message);
    }
    if (messages.length < 1) return;
    latestAction.set({ type: 'messages', messages });
  };

  const isScrubbedOrSkipped = (time: number): boolean => {
    return time == null || Math.abs(previousTime - time) > 1;
  };

  /**
   * Pushes messages up till previousTime as forced update.
   */
  const forceUpdateTillPrevious = (): void => {
    const messages: Chat.MessageAction[] = [];
    while (messageQueue.front()) {
      const showtime = messageQueue.front()?.message.showtime;
      if (showtime != null && (showtime / 1000) > previousTime) break;

      const message = messageQueue.pop();
      if (!message) return;
      messages.push(message);
    }
    latestAction.set({ type: 'forceUpdate', messages });
  };

  /**
   * Push messages up till the currentTime to store.
   */
  const pushTillCurrentToStore = (currentTimeMs: number): void => {
    pushQueueToStore((q) => {
      const frontShowtime = q.front()?.message.showtime;
      if (frontShowtime == null) return false;
      return (frontShowtime / 1000) <= currentTimeMs;
    });
  };

  /**
   * Called when the video progresses to push queued messages to store.
   */
  const onVideoProgress = (timeMs: number): void => {
    if (timeMs < 0) return;
    if (isScrubbedOrSkipped(timeMs) && isReplay) {
      console.log('Video scrubbed or skipped, forcing chat clear');
      messageQueue.clear();
      latestAction.set({ type: 'forceUpdate', messages: [] });
    } else {
      pushTillCurrentToStore(timeMs);
    }
    previousTime = timeMs;
  };

  /**
   * Sets video progress to current time in seconds.
   * Normally called by the live polling interval that runs every 250 ms.
   */
  const updateLiveProgress = (): void => {
    onVideoProgress(Date.now() / 1000);
  };

  /**
   * Checks if `message` can be found in either of `bonks` or `deletions`.
   * If it is, its message will be replaced and marked as deleted.
   */
  const processDeleted = (
    messageAction: Chat.MessageAction,
    bonks: Ytc.ParsedBonk[],
    deletions: Ytc.ParsedDeleted[]
  ): void => {
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
  };

  /**
   * Processes actionChunk.
   * Adds messages to the queue, handles author bonks, message deletions
   * and pinned messages.
   */
  const addActionChunk = (chunk: Ytc.ParsedChunk, setInitial = false, forceDisplay = false): void => {
    const messages = chunk.messages;
    const bonks = chunk.bonks;
    const deletions = chunk.deletions;
    const misc = chunk.miscActions;

    if (chunk.refresh) {
      console.log('Chunk refresh detected.');
      messageQueue.clear();
    }

    const messageActions =
      messages.sort((m1, m2) => m1.showtime - m2.showtime).reduce((result: Chat.MessageAction[], m) => {
        const messageAction: Chat.MessageAction = {
          message: m
        };
        processDeleted(messageAction, bonks, deletions);
        if ((
          !setInitial || (setInitial && isReplay && m.showtime > 0)
        ) && (
          forceDisplay || m.author.id !== selfChannel.get()?.authorExternalChannelId
        )) {
          messageQueue.push(messageAction);
        }
        result.push(messageAction);
        return result;
      }, []);

    if (setInitial) {
      initialData = [{ type: 'messages', messages: messageActions }, ...misc];
      return;
    }

    if (chunk.refresh) forceUpdateTillPrevious();

    bonks.forEach((bonk) => latestAction.set({ type: 'bonk', bonk }));
    deletions.forEach((deletion) => latestAction.set({ type: 'delete', deletion }));
    misc.forEach((action) => latestAction.set(action));
  };

  const addJsonToQueue = (
    json: string,
    isInitial: boolean,
    interceptor: Chat.Interceptor,
    forceDisplay = false
  ): void => {
    const chunk = parseChatResponse(json, isReplay);
    if (!chunk) {
      console.debug(
        'Invalid json',
        { interceptor, json, isReplay, isInitial }
      );
      return;
    }
    addActionChunk(chunk, isInitial, forceDisplay);
    console.debug(
      isInitial ? 'Saved initial data' : 'Added chunk to queue',
      { interceptor, chunk }
    );
  };

  /**
   * Update player progress to given time.
   * Only effective on VODs.
   */
  const updatePlayerProgress = (timeMs: number): void => {
    latestAction.set({ type: 'playerProgress', playerProgress: timeMs });
    if (livePolling != null || !isReplay) return;
    onVideoProgress(timeMs);
  };

  /**
   * Perform cleanup actions such as clearing live polling interval.
   */
  const cleanUp = (): void => {
    if (livePolling != null) return;
    window.clearInterval(livePolling);
  };

  const getInitialData = (): Chat.Actions[] => initialData;

  /** Start live polling if not VOD. */
  if (!isReplay) {
    livePolling = window.setInterval(updateLiveProgress, 250);
    updateLiveProgress();
  }

  return {
    latestAction,
    getInitialData,
    addJsonToQueue,
    updatePlayerProgress,
    cleanUp,
    selfChannel,
    addActionChunk
  };
}
