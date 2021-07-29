declare namespace Chat {
  type ActionChunk = {
    messages: Ytc.ParsedMessage[];
    bonks: Ytc.ParsedBonk[];
    deletions: Ytc.ParsedDeleted[];
    miscActions: Ytc.ParsedMisc[];
    isReplay: boolean;
    isInitial: boolean;
  };

  type IPayload = {
    actionChunk?: ActionChunk;
    playerProgress?: number;
  };

  type ActionChunkPayload = IPayload & {
    actionChunk: ActionChunk;
  }

  type Port = chrome.runtime.Port;

  type FrameInfo = {
    tabId: number;
    frameId: number;
  };

  type Interceptor = {
    frameInfo: FrameInfo;
    port: Port;
    clients: Port[];
    initialData: ActionChunkPayload;
  }
}
