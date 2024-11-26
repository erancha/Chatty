export interface INewMessage {
  content: string;
  fromUsername: string;
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

export interface AppState {
  messages: IMessage[];
  lastSentMessage: string;
  wsConnected: boolean;
  menuOpen: boolean;
  timeFilterVisible: boolean;
  timeWindowHours: number | null;
  auth: AuthState;
}
