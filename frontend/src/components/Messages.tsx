import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Send } from 'lucide-react';
import { IMessage } from '../redux/actions/types';
import { markMessageViewed, setTimeWindow, sendMessage } from '../redux/actions/actions';
import { RootState } from '../redux/store/store';
import { selectEffectiveTimeWindow } from '../redux/selectors/selectors';
import '../App.css';
import ReactMarkdown from 'react-markdown';
import { ToastContainer } from 'react-toastify';

interface MessagesProps {
  messages: IMessage[];
  timeFilterVisible: boolean;
  timeWindowHours: number | null;
  sendMessage: (message: string) => void;
  markMessageViewed: (messageId: string) => void;
  setTimeWindow: (minutes: number | null) => void;
}

interface MessagesState {
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

class Messages extends Component<MessagesProps, MessagesState> {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(props: MessagesProps) {
    super(props);

    this.state = {
      error: null,
      loading: false,
      newMessage: '',
    };
  }

  componentDidMount() {
    this.intervalId = setInterval(() => {
      this.forceUpdate();
    }, 60 * 1000);
  }

  componentWillUnmount() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  handleTimeWindowChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    const timeWindowHours = value === '' ? null : Math.max(1, Number(value));
    this.props.setTimeWindow(timeWindowHours);
  };

  handleMessageClick = (messageId: string) => {
    if (messageId) {
      this.props.markMessageViewed(messageId);
    }
  };

  getFilteredMessages = () => {
    const { messages, timeWindowHours } = this.props;

    if (!timeWindowHours) {
      return messages;
    }

    const cutoffTime = Date.now() - timeWindowHours * 60 * 60 * 1000;
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
    const { timeFilterVisible, timeWindowHours } = this.props;

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    const filteredMessages = this.getFilteredMessages();

    return (
      <div>
        <ToastContainer limit={1} />
        <div className='messages-container'>
          {timeFilterVisible && (
            <div className='time-filter-container'>
              <div className='time-filter-title'>Time Filter:</div>
              <input type='number' min='0' step='1' value={timeWindowHours || ''} onChange={this.handleTimeWindowChange} className='input-field' />
              <span>hours</span>
            </div>
          )}

          <div className='new-message-container'>
            <textarea
              value={newMessage}
              onChange={(e) => this.setState({ newMessage: e.target.value })}
              placeholder='Type a message...'
              className='new-message-text'
            />
            <button onClick={this.handleSendMessage} className='send-button'>
              <Send />
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
                <div className='message-timestamp'>{new Date(msg.timestamp).toLocaleString('en-GB', options)}</div>
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

const mapStateToProps = (state: RootState) => ({
  messages: state.msg.messages,
  timeFilterVisible: state.timeFilterVisible,
  timeWindowHours: selectEffectiveTimeWindow(state),
});

const mapDispatchToProps = {
  sendMessage,
  markMessageViewed,
  setTimeWindow,
};

export default connect(mapStateToProps, mapDispatchToProps)(Messages);
