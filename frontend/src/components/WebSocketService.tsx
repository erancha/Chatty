import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { AppState, IConnectionAndUsername, INewMessage } from 'redux/store/types';
import { setWSConnected, setAppVisible, setConnectionsAndUsernames, toggleConnections } from '../redux/websockets/actions';
import { loadPreviousMessages, addMessage, deleteMessage } from '../redux/msg/actions';
import appConfigData from '../appConfig.json';
import { Network } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';

class WebSocketService extends React.Component<WebSocketProps> {
  private webSocket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private reconnectAttempts = 0;
  private reconnectDelay = 1000;

  async componentDidMount() {
    try {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    } catch (err) {
      console.error('Error initializing WebSocket service:', err);
      this.props.setWSConnected(false);
    }
  }

  // Handle change from hidden to visible:
  handleVisibilityChange = () => {
    const { setAppVisible } = this.props;

    setAppVisible(document.visibilityState === 'visible');
  };

  componentDidUpdate(prevProps: WebSocketProps) {
    const { isWsConnected, JWT, isAppVisible } = this.props;

    // console.log(
    //   `isWsConnected: ${isWsConnected} (prev: ${prevProps.isWsConnected}), jwt: ${JWT?.substring(0, 10)}... (prev: ${prevProps.JWT?.substring(
    //     0,
    //     10
    //   )}...), isAppVisible: ${isAppVisible} (prev: ${prevProps.isAppVisible})`
    // );

    if (!isWsConnected && JWT && isAppVisible) {
      // console.log('--> this.connect();');
      this.connect();
    } else if (!isAppVisible && prevProps.isAppVisible) {
      // console.log('--> this.disconnect();');
      this.disconnect();
    }

    const sendToBackend = (data: any) => {
      try {
        this.webSocket?.send(JSON.stringify({ action: 'GenericWebsocketReceiver', data }));
      } catch (error) {
        toast.error(`Failed to send a message to the websocket server: ${error}`);
      }
    };

    // If this is a new message, send it on the websocket connection:
    if (this.props.newMessageToBroadcast && this.props.newMessageToBroadcast !== prevProps.newMessageToBroadcast) {
      const messageId = uuidv4();
      const messageContent = this.props.newMessageToBroadcast;
      this.props.addMessage({ id: messageId, content: messageContent, sender: null });
      sendToBackend({ messageId, messageContent });
    }

    // Send message id to be deleted on the WebSocket connection:
    if (this.props.deletedMessageToBroadcast && this.props.deletedMessageToBroadcast !== prevProps.deletedMessageToBroadcast) {
      sendToBackend({ delete: this.props.deletedMessageToBroadcast });
    }
  }

  componentWillUnmount() {
    this.disconnect();
  }

  // Component's rendering function:
  render() {
    return (
      <div
        title={this.props.isWsConnected ? `Connected, last connections update on ${this.props.lastConnectionsTimestamp}` : 'Disconnected'}
        onClick={() => this.props.toggleConnections(!this.props.showConnections)}>
        <div className='network-container'>
          <div className='left-column'>
            <Network size={20} className={`network-icon ${this.props.isWsConnected ? 'connected' : 'disconnected'}`} />
            <span className='last-connections-timestamp'>{this.props.lastConnectionsTimestamp}</span>
          </div>
          <ul className='right-column'>
            {this.props.connectionsAndUsernames &&
              this.props.showConnections &&
              this.props.connectionsAndUsernames.map((item: IConnectionAndUsername) => (
                <li key={item.connectionId} className='username'>
                  {item.username}
                </li>
              ))}
          </ul>
        </div>
      </div>
    );
  }

  // Open a connection to the backend's websocket api:
  private async connect(): Promise<void> {
    if (!this.props.chatId) console.error("'chatId' is mandatory in the query string");
    else {
      // Reset the previous connection (if opened):
      this.disconnect();

      // Introduce a delay of 100 milliseconds before proceeding with the next line of code
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Open the new connection:
      const url = `${appConfigData.WEBSOCKET_API_URL}?token=${this.props.JWT}&chatId=${this.props.chatId}`;
      // console.log(`Creating WebSocket connection with URL: ${url}`);
      this.webSocket = new WebSocket(url);

      this.webSocket.onopen = () => {
        console.log('** WebSocket connection opened **');
        this.props.setWSConnected(true);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.webSocket.onclose = (event) => {
        console.log(`** WebSocket connection closed **: ${JSON.stringify(event)}`);
        if (event.code === 1006 && this.props.isAppVisible && ++this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          console.log(`Attempting to reconnect in ${this.reconnectDelay / 1000} seconds...`);
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectDelay *= 2;
            this.props.setWSConnected(false);
          }, this.reconnectDelay);
        } else {
          // console.warn('Maximum reconnection attempts reached or manual closure.');
        }
      };

      this.webSocket.onmessage = (event) => {
        // console.log(event.data.substring(0, 60));
        const messageData = JSON.parse(event.data);
        if (messageData.previousMessages) {
          // Added functionality on $connect to load and send to the client previous chat messages and active connections.
          this.props.loadPreviousMessages(messageData.previousMessages);
          this.props.setConnectionsAndUsernames(messageData.connectionsAndUsernames);
        } else if (messageData.connectionsAndUsernames) {
          this.props.setConnectionsAndUsernames(messageData.connectionsAndUsernames);
        } else if (messageData.ping) {
          this.props.setConnectionsAndUsernames(null);
        } else if (messageData.content) {
          const newMessage: INewMessage = messageData;
          this.props.addMessage(newMessage);
          if (newMessage.sender !== '$connect' && !newMessage.sender?.includes('AWS::Events::Rule'))
            toast(`${newMessage.content} , from ${newMessage.sender}`, { autoClose: Math.max(Math.min(newMessage.content.length * 75, 4000), 2000) });
          // notify(`${messageData.content}, from: ${messageData}`);
        } else if (messageData.delete) {
          this.props.deleteMessage(messageData.delete, false);
          toast(`Message ${messageData.delete} was deleted`, { autoClose: 2000 });
        } else {
          console.error(JSON.stringify(messageData));
        }
      };

      this.webSocket.onerror = (error) => {
        console.error('** WebSocket error: **', error);
        this.props.setWSConnected(false);
      };
    }
  }

  // Close the connection to the backend's websocket api:
  private disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
      this.props.setWSConnected(false);
    }
  }
}

interface WebSocketProps {
  JWT: string | null;
  isWsConnected: boolean;
  setWSConnected: typeof setWSConnected;
  isAppVisible: boolean;
  setAppVisible: typeof setAppVisible;
  connectionsAndUsernames: IConnectionAndUsername[];
  setConnectionsAndUsernames: typeof setConnectionsAndUsernames;
  showConnections: boolean;
  toggleConnections: typeof toggleConnections;
  lastConnectionsTimestamp: string;
  chatId: string;
  loadPreviousMessages: typeof loadPreviousMessages;
  lastConnectionsTimestampISO: string;
  newMessageToBroadcast: string;
  deletedMessageToBroadcast: string;
  addMessage: typeof addMessage;
  deleteMessage: typeof deleteMessage;
}

// Maps required state from Redux store to component props
const mapStateToProps = (state: AppState) => ({
  JWT: state.auth.JWT,
  isAuthenticated: state.auth.isAuthenticated,
  isAppVisible: state.websockets.isAppVisible,
  isWsConnected: state.websockets.isConnected,
  connectionsAndUsernames: state.websockets.connectionsAndUsernames,
  showConnections: state.websockets.showConnections,
  lastConnectionsTimestamp: state.websockets.lastConnectionsTimestamp,
  lastConnectionsTimestampISO: state.websockets.lastConnectionsTimestampISO,
  chatId: state.msg.chatId,
  newMessageToBroadcast: state.msg.newMessageToBroadcast,
  deletedMessageToBroadcast: state.msg.deletedMessageToBroadcast,
});

// Map Redux actions to component props
const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      setWSConnected,
      setAppVisible,
      setConnectionsAndUsernames,
      toggleConnections,
      loadPreviousMessages,
      addMessage,
      deleteMessage,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(WebSocketService);
