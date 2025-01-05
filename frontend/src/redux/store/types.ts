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
  isConnected: boolean; // true if the client application is connected to the websocket server
  isAppVisible: boolean; // true if the client application is visible
  connectionsAndUsernames: IConnectionAndUsername[];
  showConnections: boolean;
  lastConnectionsTimestamp: string; // for display: HH:MM
  lastConnectionsTimestampISO: string; // for comparisons: Full ISO value.
}

export interface IConnectionAndUsername {
  connectionId: string;
  username: string | null;
}

//===============
// Messages
//===============
export interface MsgState {
  chatId: string;
  messages: IMessage[];
  newMessageToBroadcast: string; // message content
  deletedMessageToBroadcast: string; // message id
  timeFilterVisible: boolean;
  timeWindowDays: number | null;
}

export interface INewMessage {
  id: string;
  content: string;
  sender: string | null;
}

export interface IMessage extends INewMessage {
  timestamp: number;
  viewed: boolean;
}
