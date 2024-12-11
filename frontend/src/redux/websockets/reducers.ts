import { WebsocketsState } from '../store/types';
import initialState from '../store/initialState';
import { SET_WS_CONNECTED, SET_CONNECTIONS, TOGGLE_CONNECTIONS, ISetWSConnected, ISetConnections, IToggleConnections } from './actions';

type AppAction = ISetWSConnected | ISetConnections | IToggleConnections;

export const websocketsReducers = (state: WebsocketsState = initialState.websockets, action: AppAction): WebsocketsState => {
  switch (action.type) {
    case SET_WS_CONNECTED: {
      const currentTimestamp = new Date();
      return {
        ...state,
        isConnected: action.payload,
        lastConnectionsTimestamp: action.payload ? currentTimestamp.toLocaleString('en-GB', options) : '',
        lastConnectionsTimestampISO: action.payload ? currentTimestamp.toISOString() : '',
      };
    }
    case SET_CONNECTIONS: {
      const currentTimestamp = new Date();
      return {
        ...state,
        connections: action.payload ? action.payload : state.connections,
        lastConnectionsTimestamp: currentTimestamp.toLocaleString('en-GB', options),
        lastConnectionsTimestampISO: currentTimestamp.toISOString(),
      };
    }
    case TOGGLE_CONNECTIONS:
      return {
        ...state,
        showConnections: action.payload,
      };

    default:
      return state;
  }
};

const options: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
};
