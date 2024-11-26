import React from 'react';
import { Provider, connect } from 'react-redux';
import store from './redux/store/store';
import { AppState } from './redux/actions/types';
import { checkAuthStatus } from './redux/actions/authActions';
import { AuthContextProps, useAuth } from 'react-oidc-context';
import Messages from './components/Messages';
import WebSocketService from './components/WebSocketService';
import Menu from './components/Menu';
import appConfigData from './appConfig.json';
import { Loader2 } from 'lucide-react';

// Props for the base component
interface AppProps {
  showOverview: boolean;
  checkAuthStatus: (auth: AuthContextProps) => void;
}

// Create the base component
class AppComponent extends React.Component<AppProps & { auth: AuthContextProps }> {
  async componentDidMount() {
    this.props.checkAuthStatus(this.props.auth);
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
        {this.props.auth.isAuthenticated ? (
          <Messages />
        ) : (
          <div>
            {this.props.showOverview && (
              <div className='app-overview'>
                <hr />
                <ul className='header2'>
                  <li>Chatty allows authenticated users to chat, in groups or in private chats.</li>
                </ul>

                <div className='link-container'>
                  <a href='http://www.linkedin.com/in/eran-hachmon' target='_blank' rel='noopener noreferrer'>
                    LinkedIn
                  </a>
                  <a href='https://github.com/erancha/Chatty' target='_blank' rel='noopener noreferrer'>
                    GitHub
                  </a>
                </div>

                <a
                  href='https://lucid.app/publicSegments/view/8300a408-ca51-45e6-b6f7-2229ab1cc855/image.jpeg'
                  target='_blank'
                  rel='noopener noreferrer'>
                  <img src='https://lucid.app/publicSegments/view/8300a408-ca51-45e6-b6f7-2229ab1cc855/image.jpeg' alt='No User Authenticated' />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  showOverview: state.showOverview,
});

const mapDispatchToProps = {
  checkAuthStatus,
};

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(AppComponent);

// Create the root component that provides the store
export const App = () => {
  const auth = useAuth();

  const LoadingSpinner = () => (
    <div className='flex items-center justify-center w-full h-32'>
      <Loader2 className='w-8 h-8 animate-spin text-blue-500 spinner' />
    </div>
  );

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
