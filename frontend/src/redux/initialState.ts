import { AppState } from './actions/types';
import { DEFAULT_TIME_WINDOW_HOURS } from './constants';
import { loadMessagesFromStorage } from './middleware/localStorage';

const initialState: AppState = {
  messages: loadMessagesFromStorage(),
  lastSentMessage: '',
  wsConnected: false,
  menuOpen: false,
  timeFilterVisible: false,
  timeWindowHours: DEFAULT_TIME_WINDOW_HOURS,
  auth: {
    isAuthenticated: false,
    jwtToken: null,
    username: null,
  },
};

export default initialState;
