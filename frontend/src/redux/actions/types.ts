export interface Message {
  content: string;
  timestamp: number;
  viewed: boolean;
  id: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userName: string | null;
  jwtToken: string | null;
  error: string | null;
}

export interface AppState {
  isConfigLoaded: boolean;
  messages: Message[];
  lastSentMessage: string;
  wsConnected: boolean;
  wsUrl: string | null;
  menuOpen: boolean;
  timeFilterVisible: boolean;
  timeWindowHours: number | null;
  auth: AuthState;
}
