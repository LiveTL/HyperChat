declare namespace Chat {
  type MessageAction = {
    type: 'message';
    message: Ytc.ParsedMessage;
    deleted?: {
      replace: Ytc.ParsedRun[];
    };
  };

  type BonkAction = {
    type: 'bonk';
    bonk: Ytc.ParsedBonk;
  };

  type DeleteAction = {
    type: 'delete';
    deletion: Ytc.ParsedDeleted;
  };

  type Actions = MessageAction | BonkAction | DeleteAction | Ytc.ParsedMisc;

  type UncheckedFrameInfo = {
    tabId: number | undefined;
    frameId: number | undefined;
  };

  type FrameInfo = {
    tabId: number;
    frameId: number;
  };

  type InitialData = {
    type: 'initialData';
    initialData: Actions[];
  }

  type ThemeUpdate = {
    type: 'themeUpdate';
    dark: boolean;
  }

  type BackgroundResponse = Actions | InitialData | ThemeUpdate;

  type RegisterInterceptorMsg = {
    type: 'registerInterceptor';
    isReplay: boolean;
  };

  type RegisterClientMsg = {
    type: 'registerClient';
    frameInfo: FrameInfo;
    getInitialData: boolean;
  };

  type JsonMsg = {
    json: string;
    isReplay: boolean;
  };

  type processJsonMsg = JsonMsg & {
    type: 'processJson';
  };

  type setInitialDataMsg = JsonMsg & {
    type: 'setInitialData';
  };

  type updatePlayerProgressMsg = {
    type: 'updatePlayerProgress';
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

  type BackgroundMessage =
    RegisterInterceptorMsg | RegisterClientMsg | processJsonMsg |
    setInitialDataMsg | updatePlayerProgressMsg | setThemeMsg | getThemeMsg;

  type Port = Omit<chrome.runtime.Port, 'postMessage' | 'onMessage'> & {
    postMessage: (message: BackgroundMessage | BackgroundResponse) => void;
    onMessage: {
      addListener: (
        callback: (message: BackgroundResponse, port: Port) => void
      ) => void;
    };
  };

  type Interceptor = {
    frameInfo: FrameInfo;
    port?: Port;
    clients: Port[];
    dark: boolean;
    queue: import('./queue').YtcQueue;
    queueUnsub?: import('svelte/store').Unsubscriber;
  };

  type FrameInfoMsg = {
    type: 'frameInfo';
    frameInfo: FrameInfo;
  };

  type WindowMessage = FrameInfoMsg;
}
