import {
  SET_CONFIG_LOADED,
  TOGGLE_MENU,
  ADD_MESSAGE,
  SEND_MESSAGE_TO_WEBSOCKET,
  SET_WS_CONNECTED,
  SET_WS_URL,
  MARK_MESSAGE_VIEWED,
  TOGGLE_TIME_FILTER,
  SET_TIME_WINDOW,
  SetConfigLoadedAction,
  ToggleMenuAction,
  AddMessageAction,
  SendMessageToWebSocketAction,
  SetWSConnectedAction,
  SetWSUrlAction,
  MarkMessageViewedAction,
  ToggleTimeFilterAction,
  SetTimeWindowAction,
} from '../actions/actions';
import { AUTH_LOGIN_SUCCESS, AUTH_LOGIN_FAIL, AUTH_LOGOUT, AUTH_CLEAR_ERROR, AuthActionTypes } from '../actions/authActions';
import { AppState } from '../actions/types';
import initialState from '../initialState';

type AppAction =
  | SetConfigLoadedAction
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
    case SET_CONFIG_LOADED:
      return {
        ...state,
        isConfigLoaded: true,
      };
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
          userName: action.payload.userName,
          jwtToken: action.payload.jwtToken,
          error: null,
        },
      };
    case AUTH_LOGIN_FAIL:
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          userName: null,
          jwtToken: null,
          error: action.payload,
        },
      };
    case AUTH_LOGOUT:
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          userName: null,
          jwtToken: null,
          error: null,
        },
      };
    case AUTH_CLEAR_ERROR:
      return {
        ...state,
        auth: {
          ...state.auth,
          error: null,
        },
      };
    default:
      return state;
  }
};

export default rootReducer;
