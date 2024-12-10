import { AppState } from './actions/types';
import { DEFAULT_TIME_WINDOW_DAYS } from './constants';

const initialState: AppState = {
  auth: {
    isAuthenticated: false,
    JWT: null,
    username: null,
  },
  websockets: {
    isConnected: false,
    connections: [],
    showConnections: true,
    lastConnectionsTimestamp: '',
    lastConnectionsTimestampISO: '',
  },
  msg: {
    chatId: 'global', //TODO: Implement private and group chats.
    messages: [],
    lastSentMessage: '',
  },
  mnu: {
    showOverview: false,
    menuOpen: false,
    timeFilterVisible: false,
    timeWindowDays: DEFAULT_TIME_WINDOW_DAYS,
  },
};

export default initialState;
