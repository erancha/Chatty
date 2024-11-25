import React from 'react';
import { Provider, connect } from 'react-redux';
import store from './redux/store/store';
import Messages from './components/Messages';
import WebSocketService from './components/WebSocketService';
import Menu from './components/Menu';
import { AppState } from './redux/actions/types';
import { AuthContextProps, useAuth } from 'react-oidc-context';
import appConfigData from './appConfig.json';
import { checkAuthStatus } from './redux/actions/authActions';
import { Loader2 } from 'lucide-react';

// Props for the base component
interface AppProps {
  checkAuthStatus: (auth: AuthContextProps) => void;
}

// Create the base component
class AppComponent extends React.Component<AppProps & { auth: AuthContextProps }> {
  async componentDidMount() {
    try {
      this.props.checkAuthStatus(this.props.auth);
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  render() {
    return (
      <div className='main-container'>
        <div className='header-container'>
          <div className='menu-container'>
            <Menu />
          </div>
          {this.props.auth.isAuthenticated && <WebSocketService />}
          <div className='header-title'>Chatty</div>
          <span className='build'>{appConfigData.BUILD}</span>
        </div>
        {this.props.auth.isAuthenticated && <Messages />}
      </div>
    );
  }
}

// Map state to props with proper typing
const mapStateToProps = (state: AppState) => ({});

// Map dispatch to props
const mapDispatchToProps = {
  checkAuthStatus,
};

// Create the connected component
const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(AppComponent);

const LoadingSpinner = () => (
  <div className='flex items-center justify-center w-full h-32'>
    <Loader2 className='w-8 h-8 animate-spin text-blue-500 spinner' />
  </div>
);

// Create the root component that provides the store
export const App = () => {
  const auth = useAuth();

  // render
  return auth.isLoading ? (
    <LoadingSpinner />
  ) : auth.error ? (
    <div>Encountering error... {auth.error.message}</div>
  ) : (
    <Provider store={store}>
      <ConnectedApp auth={auth} />
    </Provider>
  );
};

export default App;
