export interface AppState {
  mnu: MnuState;
  auth: AuthState;
  websockets: WebsocketsState;
  msg: MsgState;
}

//===============
// Menu
//===============
export interface MnuState {
  showOverview: boolean;
  menuOpen: boolean;
  timeFilterVisible: boolean;
  timeWindowDays: number | null;
}

//===============
// Authentication
//===============
export interface AuthState {
  isAuthenticated: boolean;
  JWT: string | null;
  username: string | null;
}

//===============
// WebSockets
//===============
export interface WebsocketsState {
  isConnected: boolean;
  connections: IConnection[];
  showConnections: boolean;
  lastConnectionsTimestamp: string; // for display: HH:MM
  lastConnectionsTimestampISO: string; // for comparisons: Full ISO value.
}

export interface IConnection {
  connectionId: string;
  username: string | null;
}

//===============
// Messages
//===============
export interface MsgState {
  chatId: string;
  messages: IMessage[];
  lastSentMessage: string;
}

export interface INewMessage {
  content: string;
  sender: string | null;
}

export interface IMessage extends INewMessage {
  timestamp: number;
  viewed: boolean;
  id: string;
}
