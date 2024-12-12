import { Dispatch } from 'redux';
import { AuthContextProps } from 'react-oidc-context';
import appConfigData from '../../appConfig.json';

export const AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS';
export const AUTH_LOGOUT = 'AUTH_LOGOUT';

export interface IAuthLoginSuccess {
  type: typeof AUTH_LOGIN_SUCCESS;
  payload: { JWT: string; username: string };
}
const authLoginSuccess = (JWT: string, username: string): IAuthLoginSuccess => ({
  type: AUTH_LOGIN_SUCCESS,
  payload: { JWT, username },
});

export interface IAuthLogout {
  type: typeof AUTH_LOGOUT;
}
const authLogout = (): IAuthLogout => ({
  type: AUTH_LOGOUT,
});

//==================
// Action Creators
//==================
export const loginWithGoogle = (auth: AuthContextProps) => async (dispatch: Dispatch) => {
  try {
    await auth.signinRedirect();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Google Sign-in failed';
    // alert(errorMessage);
    console.error({ errorMessage });
    dispatch(authLogout());
  }
};

export const checkAuthStatus = (auth: AuthContextProps) => async (dispatch: Dispatch) => {
  try {
    if (auth.user?.profile.name && auth.user.id_token) {
      dispatch(authLoginSuccess(auth.user.id_token.toString(), auth.user.profile.name));
    } else {
      if (auth.isAuthenticated) console.warn('Invalid auth.user');
      dispatch(authLogout());
    }
  } catch (error) {
    console.error(error);
    dispatch(authLogout());
  }
};

export const logoutUser = (auth: AuthContextProps) => async (dispatch: Dispatch) => {
  try {
    await auth.removeUser();
    window.location.href = `https://${appConfigData.COGNITO.domain}/logout?client_id=${appConfigData.COGNITO.userPoolWebClientId}&logout_uri=${appConfigData.COGNITO.redirectSignOut}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Logout failed';
    console.error({ errorMessage });
  } finally {
    dispatch(authLogout());
  }
};
