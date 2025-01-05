import { MsgState } from '../store/types';
import initialState from '../store/initialState';
import {
  LOAD_PREVIOUS_MESSAGES,
  ADD_MESSAGE,
  SEND_MESSAGE,
  MARK_MESSAGE_VIEWED,
  TOGGLE_TIME_FILTER,
  SET_TIME_WINDOW,
  DELETE_MESSAGE,
  ILoadPreviousMessages,
  IAddMessage,
  ISendMessage,
  IMarkMessageViewed,
  IToggleTimeFilter,
  ISetTimeWindow,
  IDeleteMessage,
} from './actions';

type HandledActions = ILoadPreviousMessages | IAddMessage | ISendMessage | IMarkMessageViewed | IToggleTimeFilter | ISetTimeWindow | IDeleteMessage;

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
        newMessageToBroadcast: action.payload,
      };
    case ADD_MESSAGE:
      return {
        ...state,
        messages: [
          {
            id: action.payload.id,
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
    case DELETE_MESSAGE:
      return {
        ...state,
        deletedMessageToBroadcast: action.informConnectedUsers ? action.messageId : state.deletedMessageToBroadcast,
        messages: state.messages.filter((message) => message.id !== action.messageId), // Filter out the deleted message
      };
    case TOGGLE_TIME_FILTER:
      return { ...state, timeFilterVisible: action.payload };
    case SET_TIME_WINDOW:
      return { ...state, timeWindowDays: action.payload };
    default:
      return state;
  }
};
