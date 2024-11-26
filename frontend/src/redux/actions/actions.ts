import { Dispatch } from 'redux';
import { INewMessage } from './types';

export const TOGGLE_OVERVIEW = 'TOGGLE_OVERVIEW'; // show or hide the overview.
export const TOGGLE_MENU = 'TOGGLE_MENU'; // open or close the menu.
export const SET_WS_CONNECTED = 'SET_WS_CONNECTED'; // save the websocket connection state.
export const TOGGLE_TIME_FILTER = 'TOGGLE_TIME_FILTER'; // show or hide the time filter.
export const SET_TIME_WINDOW = 'SET_TIME_WINDOW'; // set the time window value in the state.
export const SEND_MESSAGE = 'SEND_MESSAGE'; // send message to other user(s).
export const ADD_MESSAGE = 'ADD_MESSAGE'; // add message to the current messages view.
export const MARK_MESSAGE_VIEWED = 'MARK_MESSAGE_VIEWED'; // mark a message as viewed.

// show or hide the overview.
export interface IToggleOverview {
  type: typeof TOGGLE_OVERVIEW;
  payload: boolean;
}

export const toggleOverview = (show: boolean): IToggleOverview => ({
  type: TOGGLE_OVERVIEW,
  payload: show,
});

// open or close the menu.
export interface IToggleMenu {
  type: typeof TOGGLE_MENU;
  payload: boolean;
}

export const toggleMenu = (isOpen: boolean): IToggleMenu => ({
  type: TOGGLE_MENU,
  payload: isOpen,
});

// save the websocket connection state.
export interface ISetWSConnected {
  type: typeof SET_WS_CONNECTED;
  payload: boolean;
}

export const setWSConnected = (connected: boolean): ISetWSConnected => ({
  type: SET_WS_CONNECTED,
  payload: connected,
});

// show or hide the time filter.
export interface IToggleTimeFilter {
  type: typeof TOGGLE_TIME_FILTER;
  payload: boolean;
}

export const toggleTimeFilter = (isVisible: boolean): IToggleTimeFilter => ({
  type: TOGGLE_TIME_FILTER,
  payload: isVisible,
});

// set the time window value in the state.
export interface ISetTimeWindow {
  type: typeof SET_TIME_WINDOW;
  payload: number | null;
}

export const setTimeWindow = (minutes: number | null): ISetTimeWindow => ({
  type: SET_TIME_WINDOW,
  payload: minutes,
});

// send message to other user(s).
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
export interface IAddMessage {
  type: typeof ADD_MESSAGE;
  payload: INewMessage;
}

export const addMessage = (message: INewMessage): IAddMessage => ({
  type: ADD_MESSAGE,
  payload: message,
});

// mark a message as viewed.
export interface IMarkMessageViewed {
  type: typeof MARK_MESSAGE_VIEWED;
  payload: string; // message id
}

export const markMessageViewed = (messageId: string): IMarkMessageViewed => ({
  type: MARK_MESSAGE_VIEWED,
  payload: messageId,
});
