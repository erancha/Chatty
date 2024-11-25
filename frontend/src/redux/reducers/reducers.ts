import {
  TOGGLE_MENU,
  ADD_MESSAGE,
  SEND_MESSAGE_TO_WEBSOCKET,
  SET_WS_CONNECTED,
  SET_WS_URL,
  MARK_MESSAGE_VIEWED,
  TOGGLE_TIME_FILTER,
  SET_TIME_WINDOW,
  ToggleMenuAction,
  AddMessageAction,
  SendMessageToWebSocketAction,
  SetWSConnectedAction,
  SetWSUrlAction,
  MarkMessageViewedAction,
  ToggleTimeFilterAction,
  SetTimeWindowAction,
} from '../actions/actions';
import { AUTH_LOGIN_SUCCESS, AUTH_LOGOUT, AuthActionTypes } from '../actions/authActions';
import { AppState } from '../actions/types';
import initialState from '../initialState';

type AppAction =
  | ToggleMenuAction
  | AddMessageAction
  | SendMessageToWebSocketAction
  | SetWSConnectedAction
  | SetWSUrlAction
  | MarkMessageViewedAction
  | ToggleTimeFilterAction
  | SetTimeWindowAction
  | AuthActionTypes;

const rootReducer = (state = initialState, action: AppAction): AppState => {
  switch (action.type) {
    case TOGGLE_MENU:
      return { ...state, menuOpen: action.payload };
    case ADD_MESSAGE:
      return {
        ...state,
        messages: [
          {
            id: performance.now().toString(),
            content: action.payload,
            timestamp: Date.now(),
            viewed: false,
          },
          ...state.messages,
        ],
      };
    case SEND_MESSAGE_TO_WEBSOCKET:
      return {
        ...state,
        lastSentMessage: action.payload,
      };
    case MARK_MESSAGE_VIEWED:
      return {
        ...state,
        messages: state.messages.map((message) => (message.id === action.payload ? { ...message, viewed: true } : message)),
      };
    case SET_WS_CONNECTED:
      return { ...state, wsConnected: action.payload };
    case SET_WS_URL:
      return { ...state, wsUrl: action.payload };
    case TOGGLE_TIME_FILTER:
      return { ...state, timeFilterVisible: action.payload };
    case SET_TIME_WINDOW:
      return { ...state, timeWindowHours: action.payload };

    // Authentication Actions
    case AUTH_LOGIN_SUCCESS:
      return {
        ...state,
        auth: {
          isAuthenticated: true,
          username: action.payload.username,
        },
      };
    case AUTH_LOGOUT:
      console.log('AUTH_LOGOUT');
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          username: null,
        },
      };
    default:
      return state;
  }
};

export default rootReducer;
