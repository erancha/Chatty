import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Component } from 'react';
import { RootState } from '../redux/store/store';
import { setWSConnected, addMessage, setWSUrl } from '../redux/actions/actions';
import { Network } from 'lucide-react';
import appConfigData from '../appConfig.json';

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
      // console.log(this.formatLog('WebSocketService.componentDidMount:'));

      // Initialize config and get WebSocket URL
      //TODO: retrieve the jwt token after authentication
      const wsUrl = `${appConfigData.WEBSOCKET_API_URL}?token=eyJraWQiOiJ4TjhRUEN0cndNd2VNUlBQUDdyaFZiWXJnYnVLWjlJNlozRFlkVlwvazk5UT0iLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiYkNNa1BnRnJld2g1MTFidXFJUXJ6USIsInN1YiI6IjczZDRhODcyLWYwZjEtNzA2My1kMzQ4LWRkMmU3OWNhMDZjYyIsImNvZ25pdG86Z3JvdXBzIjpbImV1LWNlbnRyYWwtMV9PSHExYVpZanVfR29vZ2xlIl0sImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LWNlbnRyYWwtMS5hbWF6b25hd3MuY29tXC9ldS1jZW50cmFsLTFfT0hxMWFaWWp1IiwiY29nbml0bzp1c2VybmFtZSI6Ikdvb2dsZV8xMTE2ODk5MTkzNzY5NzA5ODE5OTUiLCJnaXZlbl9uYW1lIjoiTGF1bmVyIiwib3JpZ2luX2p0aSI6IjRhMGY0NzNhLWU4N2YtNDY2OC05MjgzLThjNWFmM2ZkM2ZhMCIsImF1ZCI6IjR2dHR1NzZic2xqMWQ2MTh0Mmo2cW1yMmQyIiwiaWRlbnRpdGllcyI6W3siZGF0ZUNyZWF0ZWQiOiIxNzI5MTY4Mjk2NTAzIiwidXNlcklkIjoiMTExNjg5OTE5Mzc2OTcwOTgxOTk1IiwicHJvdmlkZXJOYW1lIjoiR29vZ2xlIiwicHJvdmlkZXJUeXBlIjoiR29vZ2xlIiwiaXNzdWVyIjpudWxsLCJwcmltYXJ5IjoidHJ1ZSJ9XSwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3MzIzNzM4NzMsIm5hbWUiOiJMYXVuZXIgMTgiLCJleHAiOjE3MzIzNzc0NzMsImlhdCI6MTczMjM3Mzg3MywiZmFtaWx5X25hbWUiOiIxOCIsImp0aSI6IjM1MzQwMDhlLTQzZWEtNDYxZC1hNDIwLTZhOTgzMTMwYzgxZSIsImVtYWlsIjoibm9hbWxhdW5lcjE4QGdtYWlsLmNvbSJ9.Y2jIQkT_jBSRoWOh07Km_8r9Vghexh29RyF_bfn0Q5mk2N8IN_enmPJWnha4bVwRUbFFoD7Ptnh48DEmI2spEn3QflxDs9kpDKr-_98w41HYnH-4XHlsa7SuxG84atNmgOJcNHeXAPo5EbWHOLkCo0pkEcGeTxztaPlRl0BYLu_fISDfWwV5oIh9K438FrGfoGk2FptDkiPtD6HzI-kBwVdK3eVCVpQiPc1Ytj7mP1RuGHxiHwuJHoX85cPPVY77UDw4zdP8M_ITfBGnbDuxZAT4SJChnFlJ7iTlh_5X-TvL6yDbybo9ZcOk01N0aEvoIMYWT5fzDk6GAfscrF-4aw`;

      if (wsUrl) this.props.setWSUrl(wsUrl);
      if (this.props.wsUrl && !this.props.wsConnected) this.connect(this.props.wsUrl);
    } catch (err) {
      console.error('Error initializing WebSocket service:', err);
      this.props.setWSConnected(false);
    }
  }

  componentDidUpdate(prevProps: Props) {
    // console.log(
    //   this.formatLog(
    //     `WebSocketService.componentDidUpdate: this.props.wsUrl: ${this.props.wsUrl} , prevProps.wsUrl: ${prevProps.wsUrl} , this.props.wsConnected: ${this.props.wsConnected} , prevProps.wsConnected: ${prevProps.wsConnected}`
    //   )
    // );
    if (this.props.wsUrl) {
      if (this.props.wsUrl !== prevProps.wsUrl || (!this.props.wsConnected && prevProps.wsConnected)) {
        this.connect(this.props.wsUrl);
      } else if (!this.props.wsConnected && prevProps.wsConnected) {
        this.closeConnection();
      }
    }

    console.log(
      this.formatLog(
        `WebSocketService.componentDidUpdate: prevProps.lastSentMessage: ${prevProps.lastSentMessage} , this.props.lastSentMessage: ${this.props.lastSentMessage}`
      )
    );
    // If a new message is sent to websocket, send it
    if (prevProps.lastSentMessage !== this.props.lastSentMessage && this.props.lastSentMessage) {
      this.sendMessage(this.props.lastSentMessage);
    }
  }

  componentWillUnmount() {
    this.cleanup();
  }

  private sendMessage(message: string) {
    this.webSocket?.send(
      JSON.stringify({
        action: 'SendMessage',
        data: { message },
      })
    );
  }

  private formatLog(message: string): string {
    return `${new Date().toLocaleTimeString()} : ${this.id} : ${message}`;
  }

  private async connect(url: string): Promise<void> {
    // console.log(this.formatLog('connect: ..'));

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
      console.log(this.formatLog(`** WebSocket connection closed **: ${JSON.stringify(event)}`));
      this.props.setWSConnected(false);

      if (event.code === 1006 && ++this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        // console.log(this.formatLog(`Attempting to reconnect in ${this.reconnectDelay / 1000} seconds...`));
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectDelay *= 2;
          this.props.setWSConnected(true);
        }, this.reconnectDelay);
      } else if (event.isTrusted && ++this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        this.reconnectTimeout = setTimeout(() => {
          // console.log(this.formatLog('Attempting to reconnect...'));
          this.props.setWSConnected(true);
        }, 1000);
      } else {
        console.warn(this.formatLog('Maximum reconnection attempts reached or manual closure.'));
      }
    };

    this.webSocket.onmessage = (event) => {
      this.props.addMessage(event.data);
    };

    this.webSocket.onerror = (error) => {
      console.error(this.formatLog('** WebSocket error: **'), error);
      this.props.setWSConnected(false);
    };
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
    this.props.setWSUrl(null);
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
  wsUrl: state.wsUrl,
  wsConnected: state.wsConnected,
  lastSentMessage: state.lastSentMessage,
});

const mapDispatchToProps = {
  setWSConnected,
  addMessage,
  setWSUrl,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
export default connector(WebSocketService);
