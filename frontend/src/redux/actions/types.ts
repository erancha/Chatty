export interface Message {
  content: string;
  timestamp: number;
  viewed: boolean;
  id: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
}

export interface AppState {
  messages: Message[];
  lastSentMessage: string;
  wsConnected: boolean;
  wsUrl: string | null;
  menuOpen: boolean;
  timeFilterVisible: boolean;
  timeWindowHours: number | null;
  auth: AuthState;
}
