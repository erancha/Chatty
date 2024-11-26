import {
  TOGGLE_OVERVIEW,
  TOGGLE_MENU,
  ADD_MESSAGE,
  SEND_MESSAGE,
  SET_WS_CONNECTED,
  MARK_MESSAGE_VIEWED,
  TOGGLE_TIME_FILTER,
  SET_TIME_WINDOW,
  IToggleOverview,
  IToggleMenu,
  IAddMessage,
  ISendMessage,
  ISetWSConnected,
  IMarkMessageViewed,
  IToggleTimeFilter,
  ISetTimeWindow,
} from '../actions/actions';
import { AUTH_LOGIN_SUCCESS, AUTH_LOGOUT, AuthActionTypes } from '../actions/authActions';
import { AppState } from '../actions/types';
import initialState from '../initialState';

type AppAction =
  | IToggleOverview
  | IToggleMenu
  | IAddMessage
  | ISendMessage
  | ISetWSConnected
  | IMarkMessageViewed
  | IToggleTimeFilter
  | ISetTimeWindow
  | AuthActionTypes;

const rootReducer = (state = initialState, action: AppAction): AppState => {
  switch (action.type) {
    case TOGGLE_OVERVIEW:
      return { ...state, showOverview: action.payload };
    case TOGGLE_MENU:
      return { ...state, menuOpen: action.payload };
    case SET_WS_CONNECTED:
      return { ...state, wsConnected: action.payload };

    // Authentication Actions
    case AUTH_LOGIN_SUCCESS:
      return {
        ...state,
        auth: {
          isAuthenticated: true,
          jwtToken: action.payload.jwtToken,
          username: action.payload.username,
        },
      };
    case AUTH_LOGOUT:
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          jwtToken: null,
          username: null,
        },
      };

    case TOGGLE_TIME_FILTER:
      return { ...state, timeFilterVisible: action.payload };
    case SET_TIME_WINDOW:
      return { ...state, timeWindowHours: action.payload };

    case SEND_MESSAGE:
      return {
        ...state,
        msg: {
          ...state.msg,
          lastSentMessage: action.payload, // Update lastSentMessage in the new nested structure
        },
      };
    case ADD_MESSAGE:
      return {
        ...state,
        msg: {
          ...state.msg,
          messages: [
            {
              id: performance.now().toString(),
              content: action.payload.content,
              fromUsername: action.payload.fromUsername,
              timestamp: Date.now(),
              viewed: action.payload.fromUsername === null,
            },
            ...state.msg.messages, // Access the messages from the new nested structure
          ],
        },
      };
    case MARK_MESSAGE_VIEWED:
      return {
        ...state,
        msg: {
          ...state.msg,
          messages: state.msg.messages.map((message) => (message.id === action.payload ? { ...message, viewed: true } : message)),
        },
      };

    default:
      return state;
  }
};

export default rootReducer;
