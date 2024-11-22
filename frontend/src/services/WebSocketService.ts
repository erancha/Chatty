import { connect, ConnectedProps } from 'react-redux';
import { Component } from 'react';
import { RootState } from '../redux/store/store';
import { setWSConnected, addMessage, setWSUrl } from '../redux/actions/actions';
import { configService } from './ConfigService';

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
      await configService.loadConfig();
      //TODO: retrieve the jwt token after authentication
      const wsUrl = `${configService.getWebSocketBaseUrl()}?token=eyJraWQiOiJ4TjhRUEN0cndNd2VNUlBQUDdyaFZiWXJnYnVLWjlJNlozRFlkVlwvazk5UT0iLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiX0pENFJjNVU1WGkxT25nbklpSC1tUSIsInN1YiI6IjIzNzQzODQyLTQwNjEtNzA5Yi00NGY4LTRlZjlhNTI3NTA5ZCIsImNvZ25pdG86Z3JvdXBzIjpbImV1LWNlbnRyYWwtMV9PSHExYVpZanVfR29vZ2xlIl0sImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LWNlbnRyYWwtMS5hbWF6b25hd3MuY29tXC9ldS1jZW50cmFsLTFfT0hxMWFaWWp1IiwiY29nbml0bzp1c2VybmFtZSI6Ikdvb2dsZV8xMTY3NDQzOTUyNjQzMjUzNjgxMDAiLCJnaXZlbl9uYW1lIjoiRXJhbiIsIm9yaWdpbl9qdGkiOiJmYTIxY2NlYy04ZjM3LTRkZTEtOTA0OS1kMWFhOWVkYjk4ZjUiLCJhdWQiOiIzanI1djZjNWMzYWVrb281NDZhZWJyaG50ZSIsImlkZW50aXRpZXMiOlt7ImRhdGVDcmVhdGVkIjoiMTcyOTA3MTM5OTkxMCIsInVzZXJJZCI6IjExNjc0NDM5NTI2NDMyNTM2ODEwMCIsInByb3ZpZGVyTmFtZSI6Ikdvb2dsZSIsInByb3ZpZGVyVHlwZSI6Ikdvb2dsZSIsImlzc3VlciI6bnVsbCwicHJpbWFyeSI6InRydWUifV0sInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNzMxODYxNTM2LCJuYW1lIjoiRXJhbiBIYWNobW9uIiwiZXhwIjoxNzMyMTEyNjIwLCJpYXQiOjE3MzIxMDkwMjAsImZhbWlseV9uYW1lIjoiSGFjaG1vbiIsImp0aSI6IjZhMzQ2NDkwLTNhMDctNDhjZS1iNjIzLTNmMDVjYTNlZjA2OCIsImVtYWlsIjoiZXJhbmNoYUBnbWFpbC5jb20ifQ.MVSqzrAGw7mP3enbkbwP53aZTKf8RUQqg6S0m9NFSfh0mQCU4K9fAJIJvtRQrqzr5d95LSH1Rp6FA6Pgtt9iMesSyy3GCKh5tynHLraHE-83cAANuzhkd2VViqZUivxaT784QPUbgd3zczWvsxCaW18WcQEvCbytksFkoaUNGDCurKHp77Aw5fbYhtdHnPMzYmI1TKX7cHH-PxEW8xmkOZ-z__zWPXtneAWtmCuUf8Q2h2dLpfosGnPB6OVfHsZuCFwCuwMoch23yoACkfDRb_LZHFL0Tm6oj_7CKKL7jr34jQ-9TV_F5jUwvvakrpCkdLCDf3Vn-PwMEXKUlllzeA`;

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
    return null; // This is a non-visual component
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
