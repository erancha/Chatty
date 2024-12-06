export interface INewMessage {
  content: string;
  sender: string | null;
}

export interface IMessage extends INewMessage {
  timestamp: number;
  viewed: boolean;
  id: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  jwtToken: string | null;
  username: string | null;
}

export interface WebsocketsState {
  isConnected: boolean;
  connections: IConnection[];
  lastIncomingMessageTimestamp: string;
}

export interface IConnection {
  connectionId: string;
  username: string | null;
}

export interface MessagesState {
  chatId: string;
  messages: IMessage[];
  lastSentMessage: string;
}

export interface AppState {
  showOverview: boolean;
  auth: AuthState;
  websockets: WebsocketsState;
  msg: MessagesState;
  menuOpen: boolean;
  timeFilterVisible: boolean;
  timeWindowDays: number | null;
}
