import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { AppState, IMessage } from '../redux/store/types';
import { selectEffectiveTimeWindow } from '../redux/store/selectors';
import { markMessageViewed, sendMessage, setTimeWindow, deleteMessage, IDeleteMessage } from '../redux/msg/actions';
import ReactMarkdown from 'react-markdown';
import { SendHorizontal, Trash2 } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import '../App.css';

interface MessagesProps {
  wsConnected: boolean;
  messages: IMessage[];
  timeFilterVisible: boolean;
  timeWindowDays: number | null;
  sendMessage: (message: string) => void;
  markMessageViewed: (messageId: string) => void;
  deleteMessage: (message: string, informConnectedUsers: boolean) => IDeleteMessage;
  setTimeWindow: (minutes: number | null) => void;
}

interface MsgState {
  error: string | null;
  loading: boolean;
  newMessage: string;
}

const options: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
  day: 'numeric',
  month: 'numeric',
  hour12: false,
};

class Messages extends Component<MessagesProps, MsgState> {
  private intervalId: NodeJS.Timeout | null = null;
  private newMessageInputRef = createRef<HTMLTextAreaElement>();

  constructor(props: MessagesProps) {
    super(props);

    this.state = {
      error: null,
      loading: false,
      newMessage: '',
    };
  }

  componentDidMount() {
    setTimeout(() => this.newMessageInputRef.current?.focus(), 1000);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.intervalId = setInterval(() => {
      this.forceUpdate();
    }, 60 * 60 * 1000); // every 1 hour re-apply the time window filter.
  }

  // Handle change from hidden to visible:
  handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') setTimeout(() => this.newMessageInputRef.current?.focus(), 1000);
  };

  componentWillUnmount() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  handleTimeWindowChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    const timeWindowDays = value === '' ? null : Math.max(1, Number(value));
    this.props.setTimeWindow(timeWindowDays);
  };

  handleMessageClick = (messageId: string) => {
    if (messageId) {
      this.props.markMessageViewed(messageId);
    }
  };

  handleDeleteMessage = (messageId: string) => {
    if (messageId) {
      this.props.deleteMessage(messageId, true);
    }
  };

  getFilteredMessages = () => {
    const { messages, timeWindowDays } = this.props;
    if (!timeWindowDays) return messages;

    const cutoffTime = Date.now() - timeWindowDays * 24 * 60 * 60 * 1000;
    return messages.filter((msg) => msg.timestamp >= cutoffTime);
  };

  handleSendMessage = () => {
    const { newMessage } = this.state;
    if (newMessage.trim()) {
      this.props.sendMessage(newMessage);
      this.setState({ newMessage: '' });
    }
  };

  render() {
    const { error, loading, newMessage } = this.state;
    const { timeFilterVisible, timeWindowDays } = this.props;

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    const filteredMessages = this.getFilteredMessages();

    return (
      <div>
        <ToastContainer limit={1} />
        <div className={`messages-container${!this.props.wsConnected ? ' disconnected' : ''}`}>
          {timeFilterVisible && (
            <div className='time-filter-container'>
              <div className='time-filter-title'>Time Filter:</div>
              <input type='number' min='0' step='1' value={timeWindowDays || ''} onChange={this.handleTimeWindowChange} className='input-field' />
              <span>days</span>
            </div>
          )}

          <div className='new-message-container'>
            <textarea
              value={newMessage}
              onChange={(e) => this.setState({ newMessage: e.target.value })}
              placeholder='Type a message...'
              className='new-message-text'
              ref={this.newMessageInputRef}
            />
            <button onClick={this.handleSendMessage} className='send-button'>
              <SendHorizontal />
            </button>
          </div>

          <div className='messages-list'>
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`message-bubble ${msg.sender === null ? 'local' : 'others'} ${msg.viewed ? 'viewed' : 'unviewed'}`}
                onClick={() => this.handleMessageClick(msg.id)}>
                <div className='message-sender' style={{ color: selectColor(msg.sender) }}>
                  {msg.sender}
                </div>
                <div className='message-content'>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <div className='message-footer'>
                  {!msg.sender /* i.e. the message was sent by the authenticated user; refer to the comment in backend\websocket\connect\connect.js: Nullify the sender attribute for records with the same sender as the current username (as done for new messages by the current user) */ && (
                    <button onClick={() => this.handleDeleteMessage(msg.id)} className='delete-button'>
                      <Trash2 />
                    </button>
                  )}
                  <div className='message-timestamp'>{new Date(msg.timestamp).toLocaleString('en-GB', options)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

// Function to select color based on sender, dynamically generating for new senders
const selectColor = (sender: string | null) => {
  if (!sender) return '#000000'; // Default to black if sender is null

  // A fixed list of distinct colors
  const colors = [
    '#FF5733', // Red
    '#3357FF', // Blue
    '#F1C40F', // Yellow
    '#8E44AD', // Purple
    '#E67E22', // Orange
    '#2ECC71', // Emerald
    '#3498DB', // Peter River
    '#9B59B6', // Amethyst
    '#E74C3C', // Alizarin
    '#1ABC9C', // Turquoise
  ];

  // Create a hash based on the string
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = sender.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to select an index from the colors array
  const colorIndex = Math.abs(hash % colors.length); // Ensure index is within the range of colors array

  return colors[colorIndex];
};

const mapStateToProps = (state: AppState) => ({
  wsConnected: state.websockets.isConnected,
  messages: state.msg.messages,
  timeFilterVisible: state.msg.timeFilterVisible,
  timeWindowDays: selectEffectiveTimeWindow(state),
});

const mapDispatchToProps = {
  sendMessage,
  markMessageViewed,
  setTimeWindow,
  deleteMessage,
};

export default connect(mapStateToProps, mapDispatchToProps)(Messages);
