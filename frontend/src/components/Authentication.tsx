import React from 'react';
import { connect } from 'react-redux';
import { loginWithGoogle, checkAuthStatus } from '../redux/actions/authActions';
import { AppState } from '../redux/actions/types';

interface AuthenticationProps {
  loginWithGoogle: () => void;
  checkAuthStatus: () => void;
  isAuthenticated: boolean;
}

class Authentication extends React.Component<AuthenticationProps> {
  componentDidMount() {
    this.props.checkAuthStatus();
  }

  handleGoogleSignIn = () => {
    this.props.loginWithGoogle();
  };

  render() {
    return <button onClick={this.handleGoogleSignIn}>Sign in with Google</button>;
  }
}

const mapStateToProps = (state: AppState) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

const mapDispatchToProps = {
  loginWithGoogle,
  checkAuthStatus,
};

export default connect(mapStateToProps, mapDispatchToProps)(Authentication);
