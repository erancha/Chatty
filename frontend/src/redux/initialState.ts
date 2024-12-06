import { AppState } from './actions/types';
import { DEFAULT_TIME_WINDOW_DAYS } from './constants';

const initialState: AppState = {
  showOverview: false,
  auth: {
    isAuthenticated: false,
    jwtToken: null,
    username: null,
  },
  websockets: {
    isConnected: false,
    connections: [],
    lastIncomingMessageTimestamp: '',
  },
  msg: {
    chatId: 'global', //TODO: Implement private and group chats.
    messages: [],
    lastSentMessage: '',
  },
  menuOpen: false,
  timeFilterVisible: false,
  timeWindowDays: DEFAULT_TIME_WINDOW_DAYS,
};

export default initialState;
