import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Component } from 'react';
import { RootState } from '../redux/store/store';
import { setWSConnected, loadPreviousMessages, addMessage } from '../redux/actions/actions';
import { Network } from 'lucide-react';
import appConfigData from '../appConfig.json';
import { INewMessage } from 'redux/actions/types';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// const notify = (notificationText: string) => {
//   // Check if the browser supports notifications
//   if (!('Notification' in window)) {
//     alert('This browser does not support desktop notification.');
//     return;
//   }

//   // Check for permission
//   Notification.requestPermission().then((permission) => {
//     if (permission === 'granted') {
//       const notification = new Notification('Chatty', {
//         body: notificationText,
//       });

//       notification.onclick = () => {
//         console.log('Notification clicked!');
//       };
//     } else if (permission === 'denied') {
//       alert('Notification permission denied. Please enable notifications.');
//     } else {
//       alert('Notification permission dismissed. Please check your settings.');
//     }
//   });
// };

type Props = ConnectedProps<typeof connector>;
class WebSocketService extends Component<Props> {
  private id: string;
  private webSocket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private reconnectAttempts = 0;
  private reconnectDelay = 1000;

  constructor(props: Props) {
    super(props);
    this.id = Math.random().toString(36).substring(2, 15);
  }

  async componentDidMount() {
    try {
      // console.log(
      //   this.formatLog(
      //     `WebSocketService.componentDidMount: this.props.wsConnected: ${this.props.wsConnected} , this.props.jwtToken: ${
      //       this.props.jwtToken ? 'exists' : 'null'
      //     }`
      //   )
      // );
      // Try connecting to the WebSocket server:
      // if (!this.props.wsConnected && this.props.jwtToken) {
      //   console.log(this.formatLog("'this.connect()' called from 'componentDidMount()'."));
      //   this.connect();
      // }
    } catch (err) {
      console.error('Error initializing WebSocket service:', err);
      this.props.setWSConnected(false);
    }
  }

  componentDidUpdate(prevProps: Props) {
    console.log(
      this.formatLog(
        `WebSocketService.componentDidUpdate: this.props.wsConnected: ${this.props.wsConnected} , prevProps.wsConnected: ${
          prevProps.wsConnected
        }, this.props.jwtToken: ${this.props.jwtToken ? 'exists' : 'null'}, prevProps.jwtToken: ${prevProps.jwtToken ? 'exists' : 'null'}`
      )
    );

    if (!this.props.wsConnected || this.props.jwtToken !== prevProps.jwtToken) {
      console.log(this.formatLog("'this.connect()' called from 'componentDidUpdate'."));
      this.connect();
    } else if (!this.props.wsConnected && prevProps.wsConnected) this.closeConnection();

    // console.log(
    //   this.formatLog(
    //     `WebSocketService.componentDidUpdate: prevProps.lastSentMessage: ${prevProps.lastSentMessage} , this.props.lastSentMessage: ${this.props.lastSentMessage}`
    //   )
    // );

    // If this is a new message, send it to websocket:
    if (this.props.lastSentMessage && this.props.lastSentMessage !== prevProps.lastSentMessage) {
      const message = this.props.lastSentMessage;
      this.props.addMessage({ content: message, sender: null });
      try {
        this.webSocket?.send(
          JSON.stringify({
            action: 'SendMessage',
            data: { message },
          })
        );
      } catch (error) {
        console.error(error);
      }
    }
  }

  componentWillUnmount() {
    this.cleanup();
  }

  private formatLog(message: string): string {
    return `${new Date().toLocaleTimeString()} : ${this.id} : ${message}`;
  }

  private async connect(): Promise<void> {
    if (!this.props.chatId) console.error("'chatId' is mandatory in the query string");
    else {
      const url = `${appConfigData.WEBSOCKET_API_URL}?token=${this.props.jwtToken}&chatId=${this.props.chatId}`;

      // Reset the previous connection (if opened):
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.closeConnection();

      // Introduce a delay of 100 milliseconds before proceeding with the next line of code
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Open the new connection:
      console.log(this.formatLog(`Creating WebSocket connection with URL: ${url}`));
      this.webSocket = new WebSocket(url);

      this.webSocket.onopen = () => {
        console.log(this.formatLog('** WebSocket connection opened **'));
        this.props.setWSConnected(true);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.webSocket.onclose = (event) => {
        console.warn(this.formatLog(`** WebSocket connection closed **: ${JSON.stringify(event)}`));
        this.props.setWSConnected(false);

        if (event.code === 1006 && ++this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          console.warn(this.formatLog(`Attempting to reconnect in ${this.reconnectDelay / 1000} seconds...`));
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectDelay *= 2;
            this.props.setWSConnected(true);
          }, this.reconnectDelay);
        } else if (event.isTrusted && ++this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.reconnectTimeout = setTimeout(() => {
            console.warn(this.formatLog('Attempting to reconnect...'));
            this.props.setWSConnected(true);
          }, 1000);
        } else {
          console.warn(this.formatLog('Maximum reconnection attempts reached or manual closure.'));
        }
      };

      this.webSocket.onmessage = (event) => {
        const messageData = JSON.parse(event.data);
        if (messageData.previousMessages) {
          // Added functionality on $connect to load and send to the client previous chat messages from DynamoDB.
          this.props.loadPreviousMessages(messageData.previousMessages);
        } else {
          const newMessage: INewMessage = messageData;
          console.log(JSON.stringify(newMessage));
          this.props.addMessage(newMessage);
          if (newMessage.sender !== '$connect')
            toast(`${newMessage.content} , from ${newMessage.sender}`, { autoClose: Math.max(Math.min(newMessage.content.length * 75, 4000), 2000) });
          // notify(`${messageData.content}, from: ${messageData}`);
        }
      };

      this.webSocket.onerror = (error) => {
        console.error(this.formatLog('** WebSocket error: **'), error);
        this.props.setWSConnected(false);
      };
    }
  }

  private closeConnection(): void {
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

  private cleanup(): void {
    this.closeConnection();
  }

  render() {
    return (
      <div title={this.props.wsConnected ? 'Connected' : 'Disconnected'}>
        <Network size={20} className={`network-icon ${this.props.wsConnected ? 'connected' : 'disconnected'}`} />
      </div>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  jwtToken: state.auth.jwtToken,
  wsConnected: state.wsConnected,
  chatId: state.msg.chatId,
  lastSentMessage: state.msg.lastSentMessage,
});

const mapDispatchToProps = {
  setWSConnected,
  loadPreviousMessages,
  addMessage,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
export default connector(WebSocketService);
