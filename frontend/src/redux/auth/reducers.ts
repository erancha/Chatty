import { AuthState } from '../store/types';
import initialState from '../store/initialState';
import { AUTH_LOGIN_SUCCESS, AUTH_LOGOUT, AuthActionTypes } from './actions';

export const authReducers = (state: AuthState = initialState.auth, action: AuthActionTypes): AuthState => {
  switch (action.type) {
    case AUTH_LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        JWT: action.payload.JWT,
        username: action.payload.username,
      };
    case AUTH_LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        JWT: null,
        username: null,
      };

    default:
      return state;
  }
};
