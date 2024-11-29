import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Component } from 'react';
import { RootState } from '../redux/store/store';
import { setWSConnected, loadPreviousMessages, addMessage } from '../redux/actions/actions';
import { Network } from 'lucide-react';
import appConfigData from '../appConfig.json';
import { INewMessage } from 'redux/actions/types';

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
      this.webSocket?.send(
        JSON.stringify({
          action: 'SendMessage',
          data: { message },
        })
      );

      // const messages = [
      //   'I think, therefore I am.',
      //   'To be, or not to be, that is the question.',
      //   'The only thing we have to fear is fear itself.',
      //   "That's one small step for man, one giant leap for mankind.",
      //   'Injustice anywhere is a threat to justice everywhere.',
      //   'I have a dream.',
      //   'The unexamined life is not worth living.',
      //   'Give me liberty, or give me death!',
      //   'The pen is mightier than the sword.',
      //   'Ask not what your country can do for you—ask what you can do for your country.',
      //   'Knowledge is power.',
      //   'Power tends to corrupt, and absolute power corrupts absolutely.',
      //   'We hold these truths to be self-evident, that all men are created equal.',
      //   'The greatest glory in living lies not in never falling, but in rising every time we fall.',
      //   'Life is either a daring adventure or nothing at all.',
      //   'The only limit to our realization of tomorrow will be our doubts of today.',
      //   'What we think, we become.',
      //   'Those who dare to fail miserably can achieve greatly.',
      //   'The future belongs to those who believe in the beauty of their dreams.',
      //   'In the end, we will remember not the words of our enemies, but the silence of our friends.',
      //   'You must be the change you wish to see in the world.',
      //   'Do what you can, with what you have, where you are.',
      //   'The mind is everything. What you think, you become.',
      //   'Success is not final, failure is not fatal: It is the courage to continue that counts.',
      //   'It does not matter how slowly you go as long as you do not stop.',
      //   'The way to get started is to quit talking and begin doing.',
      //   'The journey of a thousand miles begins with one step.',
      //   'If you cannot do great things, do small things in a great way.',
      //   'What lies behind us and what lies before us are tiny matters compared to what lies within us.',
      //   'Everything you’ve ever wanted is on the other side of fear.',
      //   "Believe you can and you're halfway there.",
      //   'The best way to predict the future is to create it.',
      //   'Act as if what you do makes a difference. It does.',
      //   'It is our choices, far more than our abilities, that show what we truly are.',
      //   'The only way to do great work is to love what you do.',
      //   'You miss 100% of the shots you don’t take.',
      //   'Happiness is not something ready-made. It comes from your own actions.',
      //   "Don't watch the clock; do what it does. Keep going.",
      //   'Success usually comes to those who are too busy to be looking for it.',
      //   "Opportunities don't happen. You create them.",
      //   'You can never cross the ocean until you have the courage to lose sight of the shore.',
      //   'Perseverance is not a long race; it is many short races one after the other.',
      //   'Hardships often prepare ordinary people for an extraordinary destiny.',
      //   'The only impossible journey is the one you never begin.',
      //   'Dream big and dare to fail.',
      //   'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
      //   'To succeed in life, you need three things: a wishbone, a backbone, and a funny bone.',
      //   'Do not wait to strike till the iron is hot, but make it hot by striking.',
      //   'You have to expect things of yourself before you can do them.',
      //   'The best revenge is massive success.',
      //   'Success is how high you bounce when you hit bottom.',
      //   'Strive not to be a success, but rather to be of value.',
      //   'The only place where success comes before work is in the dictionary.',
      //   'The secret of getting ahead is getting started.',
      //   'What we achieve inwardly will change outer reality.',
      //   'It’s not whether you get knocked down, it’s whether you get up.',
      //   'The man who moves a mountain begins by carrying away small stones.',
      //   'Challenges are what make life interesting; overcoming them is what makes life meaningful.',
      //   'The only thing we have to fear is fear itself.',
      //   'Life is not about waiting for the storm to pass, but about learning to dance in the rain.',
      //   'Turn your wounds into wisdom.',
      //   'The best way out is always through.',
      //   'You will face many defeats in life, but never let yourself be defeated.',
      //   'Doubt kills more dreams than failure ever will.',
      //   'It always seems impossible until it’s done.',
      //   'Your present circumstances don’t determine where you can go; they merely determine where you start.',
      //   'Keep your face always toward the sunshine—and shadows will fall behind you.',
      //   'The greatest discovery of all time is that a person can change his future by merely changing his attitude.',
      //   "You don't have to be great to start, but you have to start to be great.",
      //   'Success is not how high you have climbed, but how you make a positive difference to the world.',
      //   'The future depends on what you do today.',
      //   "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.",
      //   'We may encounter many defeats but we must not be defeated.',
      //   'If you want to lift yourself up, lift up someone else.',
      //   'What you get by achieving your goals is not as important as what you become by achieving your goals.',
      //   'Setting goals is the first step in turning the invisible into the visible.',
      //   'You cannot swim for new horizons until you have courage to lose sight of the shore.',
      //   'Life is 10% what happens to us and 90% how we react to it.',
      //   "Success is not about the destination, it's about the journey.",
      //   'Your life does not get better by chance, it gets better by change.',
      //   'Everything you can imagine is real.',
      //   'You are never too old to set another goal or to dream a new dream.',
      //   'The best and most beautiful things in the world cannot be seen or even heard but must be felt with the heart.',
      //   'Life is short, and it is up to you to make it sweet.',
      //   'Don’t count the days, make the days count.',
      //   'The purpose of our lives is to be happy.',
      //   'If you want to live a happy life, tie it to a goal, not to people or things.',
      //   'You must do the things you think you cannot do.',
      //   'Success is not about being the best. It’s about always getting better.',
      //   'The only limit to our realization of tomorrow will be our doubts of today.',
      //   'Everything has beauty, but not everyone sees it.',
      //   'What you do speaks so loudly that I cannot hear what you say.',
      // ];
      // messages.forEach((sentence) => {
      //   const newMessage = `**${message}** : *${sentence}*`;
      //   this.props.addMessage({ content: newMessage, sender: null });
      //   this.webSocket?.send(
      //     JSON.stringify({
      //       action: 'SendMessage',
      //       data: { message: newMessage },
      //     })
      //   );
      // });
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
        const messageData = JSON.parse(event.data);
        if (messageData.previousMessages) {
          // Added functionality on $connect to load and send to the client previous chat messages from DynamoDB.
          this.props.loadPreviousMessages(messageData.previousMessages);
        } else {
          const newMessage: INewMessage = messageData;
          this.props.addMessage(newMessage);
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
