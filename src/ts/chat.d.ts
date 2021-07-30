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

  type UncheckedFrameInfo = {
    tabId: number | undefined;
    frameId: number | undefined;
  };

  type FrameInfo = {
    tabId: number;
    frameId: number;
  };

  type Interceptor = {
    frameInfo: FrameInfo;
    port?: Port;
    clients: Port[];
    initialData?: ActionChunk;
  };

  const validFrameInfo = (f: UncheckedFrameInfo, port: Port): f is FrameInfo => {
    const check = f.tabId && f.frameId;
    if (!check) {
      console.error('Invalid frame info', { port });
    }
    return check;
  };

  type RegisterInterceptorMsg = {
    type: 'registerInterceptor';
  };

  type RegisterClientMsg = {
    type: 'registerClient';
    frameInfo: FrameInfo;
    getInitialData: boolean;
  };

  type ResponseMsg = {
    response: string;
    isReplay: boolean;
  };

  type SendToClientsMsg = ResponseMsg & {
    type: 'sendToClients';
  };

  type setInitialDataMsg = ResponseMsg & {
    type: 'setInitialData';
  };

  type sendPlayerProgressMsg = {
    type: 'sendPlayerProgress';
    playerProgress: number;
  };

  type BackgroundMessage = RegisterInterceptorMsg | RegisterClientMsg | SendToClientsMsg | setInitialDataMsg | sendPlayerProgressMsg
}
