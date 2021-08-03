declare namespace Chat {
  type ParsedChunk = {
    type: 'actionChunk' | 'initialDataChunk';
    messages: Ytc.ParsedMessage[];
    bonks: Ytc.ParsedBonk[];
    deletions: Ytc.ParsedDeleted[];
    miscActions: Ytc.ParsedMisc[];
    isReplay: boolean;
  };

  type ActionChunk = ParsedChunk & {
    type: 'actionChunk';
  }

  type InitialDataChunk = ParsedChunk & {
    type: 'initialDataChunk';
  }

  type PlayerProgress = {
    type: 'playerProgress';
    playerProgress: number;
  }

  type ThemeUpdate = {
    type: 'themeUpdate';
    dark: boolean;
  }

  type BackgroundPayload = ActionChunk | InitialDataChunk | PlayerProgress | ThemeUpdate;

  type UncheckedFrameInfo = {
    tabId: number | undefined;
    frameId: number | undefined;
  };

  type FrameInfo = {
    tabId: number;
    frameId: number;
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

  type setThemeMsg = {
    type: 'setTheme';
    dark: boolean;
  };

  type getThemeMsg = {
    type: 'getTheme';
    frameInfo: FrameInfo;
  };

  type BackgroundMessage = RegisterInterceptorMsg | RegisterClientMsg | SendToClientsMsg | setInitialDataMsg | sendPlayerProgressMsg | setThemeMsg | getThemeMsg

  type Port = chrome.runtime.Port & {
    postMessage: (message: BackgroundMessage | BackgroundPayload) => void;
  };

  type Interceptor = {
    frameInfo: FrameInfo;
    port?: Port;
    clients: Port[];
    initialData?: InitialDataChunk;
    dark: boolean;
  };

  type Message = Ytc.ParsedMessage & { deleted?: boolean }

  type FrameInfoMsg = {
    type: 'frameInfo';
    frameInfo: FrameInfo;
  }

  type WindowMessage = FrameInfoMsg;
}
