export interface INewMessage {
  content: string;
  fromUsername: string | null;
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

export interface MessagesState {
  chatId: string;
  messages: IMessage[];
  lastSentMessage: string;
}

export interface AppState {
  showOverview: boolean;
  auth: AuthState;
  wsConnected: boolean;
  msg: MessagesState;
  menuOpen: boolean;
  timeFilterVisible: boolean;
  timeWindowHours: number | null;
}
