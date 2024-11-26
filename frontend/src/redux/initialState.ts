import { AppState } from './actions/types';
import { DEFAULT_TIME_WINDOW_HOURS } from './constants';
import { loadMessagesFromStorage } from './middleware/localStorage';

const initialState: AppState = {
  showOverview: false,
  auth: {
    isAuthenticated: false,
    jwtToken: null,
    username: null,
  },
  wsConnected: false,
  msg: {
    chatId: 'global', //TODO: Implement private and group chats.
    messages: loadMessagesFromStorage(),
    lastSentMessage: '',
  },
  menuOpen: false,
  timeFilterVisible: false,
  timeWindowHours: DEFAULT_TIME_WINDOW_HOURS,
};

export default initialState;
