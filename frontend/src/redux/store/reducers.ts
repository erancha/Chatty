import { combineReducers } from 'redux';
import { mnuReducers } from '../mnu/reducers';
import { authReducers } from '../auth/reducers';
import { websocketsReducers } from '../websockets/reducers';
import { msgReducers } from '../msg/reducers';

const rootReducer = combineReducers({
  mnu: mnuReducers,
  auth: authReducers,
  websockets: websocketsReducers,
  msg: msgReducers,
});

export default rootReducer;
