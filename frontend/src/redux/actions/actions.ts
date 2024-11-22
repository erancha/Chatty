import { Dispatch } from 'redux';

export const TOGGLE_MENU = 'TOGGLE_MENU';
export const ADD_MESSAGE = 'ADD_MESSAGE';
export const SET_WS_CONNECTED = 'SET_WS_CONNECTED';
export const SET_WS_URL = 'SET_WS_URL';
export const MARK_MESSAGE_VIEWED = 'MARK_MESSAGE_VIEWED';
export const TOGGLE_TIME_FILTER = 'TOGGLE_TIME_FILTER';
export const SET_TIME_WINDOW = 'SET_TIME_WINDOW';
export const SEND_MESSAGE = 'SEND_MESSAGE';
export const SEND_MESSAGE_TO_WEBSOCKET = 'SEND_MESSAGE_TO_WEBSOCKET';
export const SET_CONFIG_LOADED = 'SET_CONFIG_LOADED';

export interface SetConfigLoadedAction {
  type: typeof SET_CONFIG_LOADED;
}

export const setConfigLoaded = (): SetConfigLoadedAction => ({
  type: SET_CONFIG_LOADED,
});

export interface ToggleMenuAction {
  type: typeof TOGGLE_MENU;
  payload: boolean;
}

export const toggleMenu = (isOpen: boolean): ToggleMenuAction => ({
  type: TOGGLE_MENU,
  payload: isOpen,
});

export interface AddMessageAction {
  type: typeof ADD_MESSAGE;
  payload: string;
}

export interface SetWSConnectedAction {
  type: typeof SET_WS_CONNECTED;
  payload: boolean;
}

export interface SetWSUrlAction {
  type: typeof SET_WS_URL;
  payload: string | null;
}

export interface MarkMessageViewedAction {
  type: typeof MARK_MESSAGE_VIEWED;
  payload: string; // message id
}

export const addMessage = (message: string): AddMessageAction => ({
  type: ADD_MESSAGE,
  payload: message,
});

export const setWSConnected = (connected: boolean): SetWSConnectedAction => ({
  type: SET_WS_CONNECTED,
  payload: connected,
});

export const setWSUrl = (url: string | null): SetWSUrlAction => ({
  type: SET_WS_URL,
  payload: url,
});

export const markMessageViewed = (messageId: string): MarkMessageViewedAction => ({
  type: MARK_MESSAGE_VIEWED,
  payload: messageId,
});

export interface ToggleTimeFilterAction {
  type: typeof TOGGLE_TIME_FILTER;
  payload: boolean;
}

export interface SetTimeWindowAction {
  type: typeof SET_TIME_WINDOW;
  payload: number | null;
}

export const toggleTimeFilter = (isVisible: boolean): ToggleTimeFilterAction => ({
  type: TOGGLE_TIME_FILTER,
  payload: isVisible,
});

export const setTimeWindow = (minutes: number | null): SetTimeWindowAction => ({
  type: SET_TIME_WINDOW,
  payload: minutes,
});

export interface SendMessageToWebSocketAction {
  type: typeof SEND_MESSAGE_TO_WEBSOCKET;
  payload: string;
}

const sendMessageToWebSocket = (message: string): SendMessageToWebSocketAction => ({
  type: SEND_MESSAGE_TO_WEBSOCKET,
  payload: message,
});

export const sendMessage = (content: string) => (dispatch: Dispatch) => {
  dispatch(sendMessageToWebSocket(content));
};
