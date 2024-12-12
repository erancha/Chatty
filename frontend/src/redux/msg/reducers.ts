import { MsgState } from '../store/types';
import initialState from '../store/initialState';
import {
  LOAD_PREVIOUS_MESSAGES,
  ADD_MESSAGE,
  SEND_MESSAGE,
  MARK_MESSAGE_VIEWED,
  TOGGLE_TIME_FILTER,
  SET_TIME_WINDOW,
  ILoadPreviousMessages,
  IAddMessage,
  ISendMessage,
  IMarkMessageViewed,
  IToggleTimeFilter,
  ISetTimeWindow,
} from './actions';

type HandledActions = ILoadPreviousMessages | IAddMessage | ISendMessage | IMarkMessageViewed | IToggleTimeFilter | ISetTimeWindow;

export const msgReducers = (state: MsgState = initialState.msg, action: HandledActions): MsgState => {
  switch (action.type) {
    case LOAD_PREVIOUS_MESSAGES:
      return {
        ...state,
        messages: [...action.payload],
      };
    case SEND_MESSAGE:
      return {
        ...state,
        lastSentMessage: action.payload,
      };
    case ADD_MESSAGE:
      return {
        ...state,
        messages: [
          {
            id: performance.now().toString(),
            content: action.payload.content,
            sender: action.payload.sender,
            timestamp: Date.now(),
            viewed: action.payload.sender === null,
          },
          ...state.messages,
        ],
      };
    case MARK_MESSAGE_VIEWED:
      return {
        ...state,
        messages: state.messages.map((message) => (message.id === action.payload ? { ...message, viewed: true } : message)),
      };

    case TOGGLE_TIME_FILTER:
      return { ...state, timeFilterVisible: action.payload };
    case SET_TIME_WINDOW:
      return { ...state, timeWindowDays: action.payload };

    default:
      return state;
  }
};
