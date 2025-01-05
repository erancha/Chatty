import { IConnectionAndUsername } from '../store/types';

// save the current websocket connection state.
export const SET_WS_CONNECTED = 'SET_WS_CONNECTED';
export interface ISetWSConnected {
  type: typeof SET_WS_CONNECTED;
  payload: boolean;
}
export const setWSConnected = (isConnected: boolean): ISetWSConnected => ({
  type: SET_WS_CONNECTED,
  payload: isConnected,
});

// save the visiblility of the application (whether the page is displayed in the browser or not).
export const SET_APP_VISIBLE = 'SET_APP_VISIBLE';
export interface ISetAppVisible {
  type: typeof SET_APP_VISIBLE;
  payload: boolean;
}
export const setAppVisible = (isVisible: boolean): ISetAppVisible => ({
  type: SET_APP_VISIBLE,
  payload: isVisible,
});

// save all connected users in the state:
export const SET_CONNECTIONS_AND_USERNAMES = 'SET_CONNECTIONS_AND_USERNAMES';
export interface ISetConnectionsAndUsernames {
  type: typeof SET_CONNECTIONS_AND_USERNAMES;
  payload: IConnectionAndUsername[] | null;
}
export const setConnectionsAndUsernames = (connectionsAndUsernames: IConnectionAndUsername[] | null): ISetConnectionsAndUsernames => ({
  type: SET_CONNECTIONS_AND_USERNAMES,
  payload: connectionsAndUsernames,
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
