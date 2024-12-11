import { IConnection } from '../store/types';

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
