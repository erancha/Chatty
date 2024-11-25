import { AppState } from './actions/types';
import { DEFAULT_TIME_WINDOW_HOURS } from './constants';
import { loadMessagesFromStorage } from './middleware/localStorage';

const initialState: AppState = {
  messages: loadMessagesFromStorage(),
  lastSentMessage: '',
  wsConnected: false,
  wsUrl: null,
  menuOpen: false,
  timeFilterVisible: false,
  timeWindowHours: DEFAULT_TIME_WINDOW_HOURS,
  auth: {
    isAuthenticated: false,
    username: null,
  },
};

export default initialState;
