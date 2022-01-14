declare namespace GTL {
  interface TranslatePacket {
    type: 'request' | 'response';
    targetLanguage: string;
    text: string;
    messageID: string;
  }
  interface TranslateRequest {
    targetLanguage: string;
    text: string;
    messageID: string;
    callback: (response: TranslatePacket) => void;
  }
}
