import { AppState } from './actions/types';
import { DEFAULT_TIME_WINDOW_HOURS } from './constants';
import { loadMessagesFromStorage } from './middleware/localStorage';

const initialState: AppState = {
  isConfigLoaded: false,
  messages: loadMessagesFromStorage(),
  lastSentMessage: '',
  wsConnected: false,
  wsUrl: null,
  menuOpen: false,
  timeFilterVisible: false,
  timeWindowHours: DEFAULT_TIME_WINDOW_HOURS,
  auth: {
    isAuthenticated: false,
    userName: null,
    jwtToken: null,
    error: null,
  },
};

export default initialState;
