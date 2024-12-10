import { Dispatch } from 'redux';
import { IConnection, INewMessage, IMessage } from './types';

// show or hide the overview.
export const TOGGLE_OVERVIEW = 'TOGGLE_OVERVIEW';
export interface IToggleOverview {
  type: typeof TOGGLE_OVERVIEW;
  payload: boolean;
}
export const toggleOverview = (show: boolean): IToggleOverview => ({
  type: TOGGLE_OVERVIEW,
  payload: show,
});

// open or close the menu.
export const TOGGLE_MENU = 'TOGGLE_MENU';
export interface IToggleMenu {
  type: typeof TOGGLE_MENU;
  payload: boolean;
}
export const toggleMenu = (isOpen: boolean): IToggleMenu => ({
  type: TOGGLE_MENU,
  payload: isOpen,
});

// save the current websocket connection state.
export const SET_WS_CONNECTED = 'SET_WS_CONNECTED';
export interface ISetWSConnected {
  type: typeof SET_WS_CONNECTED;
  payload: boolean;
}
export const setWSConnected = (connected: boolean): ISetWSConnected => ({
  type: SET_WS_CONNECTED,
  payload: connected,
});

// save all connected users in the state:
export const SET_CONNECTIONS = 'SET_CONNECTIONS';
export interface ISetConnections {
  type: typeof SET_CONNECTIONS;
  payload: IConnection[] | null;
}
export const setConnections = (connections: IConnection[] | null): ISetConnections => ({
  type: SET_CONNECTIONS,
  payload: connections,
});

// show or hide the connected users:
export const TOGGLE_CONNECTIONS = 'TOGGLE_CONNECTIONS';
export interface IToggleConnections {
  type: typeof TOGGLE_CONNECTIONS;
  payload: boolean;
}
export const toggleConnections = (show: boolean): IToggleConnections => ({
  type: TOGGLE_CONNECTIONS,
  payload: show,
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
