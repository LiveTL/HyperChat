declare namespace Chat {
  interface MessageDeletedObj {
    replace: Ytc.ParsedRun[];
  }

  interface MessageAction {
    type: 'message';
    message: Ytc.ParsedMessage;
    deleted?: MessageDeletedObj;
  }

  interface BonkAction {
    type: 'bonk';
    bonk: Ytc.ParsedBonk;
  }

  interface DeleteAction {
    type: 'delete';
    deletion: Ytc.ParsedDeleted;
  }

  interface PlayerProgressAction {
    type: 'playerProgress';
    playerProgress: number;
  }

  type Actions = MessageAction | BonkAction | DeleteAction | Ytc.ParsedMisc | PlayerProgressAction;

  interface UncheckedFrameInfo {
    tabId: number | undefined;
    frameId: number | undefined;
  }

  interface FrameInfo {
    tabId: number;
    frameId: number;
  }

  interface InitialData {
    type: 'initialData';
    initialData: Actions[];
  }

  interface ThemeUpdate {
    type: 'themeUpdate';
    dark: boolean;
  }

  type BackgroundResponse = Actions | InitialData | ThemeUpdate;

  interface RegisterInterceptorMsg {
    type: 'registerInterceptor';
    isReplay: boolean;
  }

  interface RegisterClientMsg {
    type: 'registerClient';
    frameInfo: FrameInfo;
    getInitialData: boolean;
  }

  interface JsonMsg {
    json: string;
    isReplay: boolean;
  }

  type processJsonMsg = JsonMsg & {
    type: 'processJson';
  };

  type setInitialDataMsg = JsonMsg & {
    type: 'setInitialData';
  };

  interface updatePlayerProgressMsg {
    type: 'updatePlayerProgress';
    playerProgress: number;
  }

  interface setThemeMsg {
    type: 'setTheme';
    dark: boolean;
  }

  interface getThemeMsg {
    type: 'getTheme';
    frameInfo: FrameInfo;
  }

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

  interface Interceptor {
    frameInfo: FrameInfo;
    port?: Port;
    clients: Port[];
    dark: boolean;
    queue: import('./queue').YtcQueue;
    queueUnsub?: import('./queue').Unsubscriber;
  }
}
