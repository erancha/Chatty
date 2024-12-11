import { MsgState } from '../store/types';
import initialState from '../store/initialState';
import {
  LOAD_PREVIOUS_MESSAGES,
  ADD_MESSAGE,
  SEND_MESSAGE,
  MARK_MESSAGE_VIEWED,
  ILoadPreviousMessages,
  IAddMessage,
  ISendMessage,
  IMarkMessageViewed,
} from './actions';

type AppAction = ILoadPreviousMessages | IAddMessage | ISendMessage | IMarkMessageViewed;

export const msgReducers = (state: MsgState = initialState.msg, action: AppAction): MsgState => {
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

    default:
      return state;
  }
};
