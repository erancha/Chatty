import { Dispatch } from 'redux';
import { jwtDecode } from 'jwt-decode';
import { signInWithRedirect, signOut, fetchAuthSession } from '@aws-amplify/auth';

// Action Types
export const AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS';
export const AUTH_LOGIN_FAIL = 'AUTH_LOGIN_FAIL';
export const AUTH_LOGOUT = 'AUTH_LOGOUT';
export const AUTH_CLEAR_ERROR = 'AUTH_CLEAR_ERROR';

// Action Interfaces
interface AuthLoginSuccessAction {
  type: typeof AUTH_LOGIN_SUCCESS;
  payload: { userName: string; jwtToken: string };
}

interface AuthLoginFailAction {
  type: typeof AUTH_LOGIN_FAIL;
  payload: string;
}

interface AuthLogoutAction {
  type: typeof AUTH_LOGOUT;
}

interface AuthClearErrorAction {
  type: typeof AUTH_CLEAR_ERROR;
}

export type AuthActionTypes = AuthLoginSuccessAction | AuthLoginFailAction | AuthLogoutAction | AuthClearErrorAction;

// Action Creators
export const loginWithGoogle = () => async (dispatch: Dispatch) => {
  try {
    await signInWithRedirect({ provider: 'Google' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Google Sign-in failed';
    dispatch({
      type: AUTH_LOGIN_FAIL,
      payload: errorMessage,
    });
  }
};

export const checkAuthStatus = () => async (dispatch: Dispatch) => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();

    if (idToken) {
      const decodedToken = jwtDecode<{ name?: string; email?: string }>(idToken);

      dispatch({
        type: AUTH_LOGIN_SUCCESS,
        payload: {
          userName: decodedToken.name || decodedToken.email || 'User',
          jwtToken: idToken,
        },
      });
    } else {
      dispatch({ type: AUTH_LOGOUT });
    }
  } catch (error) {
    dispatch({ type: AUTH_LOGOUT });
  }
};

export const logoutUser = () => async (dispatch: Dispatch) => {
  try {
    await signOut();
    dispatch({ type: AUTH_LOGOUT });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Logout failed';
    dispatch({
      type: AUTH_LOGIN_FAIL,
      payload: errorMessage,
    });
  }
};

export const clearAuthError = (): AuthClearErrorAction => ({
  type: AUTH_CLEAR_ERROR,
});
