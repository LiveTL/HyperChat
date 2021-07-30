declare namespace Chat {
  type ActionChunk = {
    type: 'actionChunk';
    messages: Ytc.ParsedMessage[];
    bonks: Ytc.ParsedBonk[];
    deletions: Ytc.ParsedDeleted[];
    miscActions: Ytc.ParsedMisc[];
    isReplay: boolean;
    isInitial: boolean;
  };

  type PlayerProgress = {
    type: 'playerProgress';
    playerProgress: number;
  }

  type Payload = ActionChunk | PlayerProgress;

  type Port = chrome.runtime.Port;

  type FrameInfo = {
    tabId: number;
    frameId: number;
  };

  type Interceptor = {
    frameInfo: FrameInfo;
    port: Port;
    clients: Port[];
    initialData: ActionChunk;
  }
}
