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

  type ThemeUpdate = {
    type: 'themeUpdate';
    dark: boolean;
  }

  type Payload = ActionChunk | PlayerProgress | ThemeUpdate;

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
    dark: boolean;
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

  type Message = Ytc.ParsedMessage & { deleted?: boolean }

  type FrameInfoMsg = {
    type: 'frameInfo';
    frameInfo: FrameInfo;
  }

  type WindowMessage = FrameInfoMsg;
}
