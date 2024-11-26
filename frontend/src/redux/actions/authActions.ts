import { AuthContextProps } from 'react-oidc-context';
import { Dispatch } from 'redux';
import appConfigData from '../../appConfig.json';

// Action Types
export const AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS';
export const AUTH_LOGOUT = 'AUTH_LOGOUT';

// Action Interfaces
interface AuthLoginSuccessAction {
  type: typeof AUTH_LOGIN_SUCCESS;
  payload: { jwtToken: string; username: string };
}

interface AuthLogoutAction {
  type: typeof AUTH_LOGOUT;
}

const authLoginSuccess = (jwtToken: string, username: string): AuthLoginSuccessAction => ({
  type: AUTH_LOGIN_SUCCESS,
  payload: { jwtToken, username },
});
const authLogout = (): AuthLogoutAction => ({
  type: AUTH_LOGOUT,
});

export type AuthActionTypes = AuthLoginSuccessAction | AuthLogoutAction;

// Action Creators
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
    // console.log(`checkAuthStatus: ${JSON.stringify(auth.user, null, 3)}`);
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
