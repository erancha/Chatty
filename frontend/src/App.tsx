import React from 'react';
import { Provider } from 'react-redux';
import { connect } from 'react-redux';
import store from './redux/store/store';
import { setConfigLoaded } from './redux/actions/actions';
import Messages from './components/Messages';
import { configService } from './services/ConfigService';
import WebSocketService from './components/WebSocketService';
import Menu from './components/Menu';
import { AppState } from './redux/actions/types';

// Props for the base component
interface AppProps {
  setConfigLoaded: () => void;
  isConfigLoaded: boolean;
}

// Create the base component
class AppComponent extends React.Component<AppProps> {
  async componentDidMount() {
    try {
      await configService.loadConfig();
      this.props.setConfigLoaded();
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  render() {
    const { isConfigLoaded } = this.props;

    return (
      <div className='main-container'>
        <div className='header-container'>
          <div className='menu-container'>
            <Menu />
          </div>
          <WebSocketService />
          <div className='header-title'>Chatty</div>
          {isConfigLoaded && <span className='build'>{configService.getConfig().BUILD}</span>}
        </div>
        <Messages />
      </div>
    );
  }
}

// Map state to props with proper typing
const mapStateToProps = (state: AppState) => ({
  isConfigLoaded: state.isConfigLoaded,
});

// Map dispatch to props
const mapDispatchToProps = {
  setConfigLoaded,
};

// Create the connected component
const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(AppComponent);

// Create the root component that provides the store
const App: React.FC = () => (
  <Provider store={store}>
    <ConnectedApp />
  </Provider>
);

export default App;
