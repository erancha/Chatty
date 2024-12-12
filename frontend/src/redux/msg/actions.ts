import { Dispatch } from 'redux';
import { INewMessage, IMessage } from '../store/types';

// add previous messages to the current messages view.
export const LOAD_PREVIOUS_MESSAGES = 'LOAD_PREVIOUS_MESSAGES';
export interface ILoadPreviousMessages {
  type: typeof LOAD_PREVIOUS_MESSAGES;
  payload: IMessage[];
}
export const loadPreviousMessages = (messages: IMessage[]): ILoadPreviousMessages => ({
  type: LOAD_PREVIOUS_MESSAGES,
  payload: messages,
});

// send message to other user(s).
export const SEND_MESSAGE = 'SEND_MESSAGE';
export interface ISendMessage {
  type: typeof SEND_MESSAGE;
  payload: string;
}
export const sendMessage = (content: string) => (dispatch: Dispatch) => {
  dispatch({
    type: SEND_MESSAGE,
    payload: content,
  });
};

// add message to the current messages view.
export const ADD_MESSAGE = 'ADD_MESSAGE';
export interface IAddMessage {
  type: typeof ADD_MESSAGE;
  payload: INewMessage;
}
export const addMessage = (message: INewMessage): IAddMessage => ({
  type: ADD_MESSAGE,
  payload: message,
});

// mark a message as viewed.
export const MARK_MESSAGE_VIEWED = 'MARK_MESSAGE_VIEWED';
export interface IMarkMessageViewed {
  type: typeof MARK_MESSAGE_VIEWED;
  payload: string; // message id
}
export const markMessageViewed = (messageId: string): IMarkMessageViewed => ({
  type: MARK_MESSAGE_VIEWED,
  payload: messageId,
});

// show or hide the time filter:
export const TOGGLE_TIME_FILTER = 'TOGGLE_TIME_FILTER';
export interface IToggleTimeFilter {
  type: typeof TOGGLE_TIME_FILTER;
  payload: boolean;
}
export const toggleTimeFilter = (isVisible: boolean): IToggleTimeFilter => ({
  type: TOGGLE_TIME_FILTER,
  payload: isVisible,
});

// set the time window value in the state.
export const SET_TIME_WINDOW = 'SET_TIME_WINDOW';
export interface ISetTimeWindow {
  type: typeof SET_TIME_WINDOW;
  payload: number | null;
}
export const setTimeWindow = (minutes: number | null): ISetTimeWindow => ({
  type: SET_TIME_WINDOW,
  payload: minutes,
});
