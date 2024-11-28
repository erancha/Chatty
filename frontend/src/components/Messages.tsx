import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Send } from 'lucide-react';
import { IMessage } from '../redux/actions/types';
import { markMessageViewed, setTimeWindow, sendMessage } from '../redux/actions/actions';
import { RootState } from '../redux/store/store';
import { selectEffectiveTimeWindow } from '../redux/selectors/selectors';
import '../App.css';

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
              <div className='message-sender'>{msg.sender}</div>
              <div className='message-content'>{msg.content}</div>
              <div className='message-timestamp'>{new Date(msg.timestamp).toLocaleString('en-US', options)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

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
