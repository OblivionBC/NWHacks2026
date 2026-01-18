import { useState, useEffect, useRef } from 'react';
import './ChatInterface.css';

function ChatInterface({ chatId, nodes, onSendMessage, isLoading }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [nodes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  if (!chatId) {
    return (
      <div className="chat-interface">
        <div className="chat-empty">
          <p>Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {nodes.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          nodes.map((node) => (
            <div key={node.id} className={`message ${node.type.toLowerCase()}`}>
              <div className="message-header">
                <span className="message-type">{node.type}</span>
              </div>
              <div className="message-content">{node.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message ai loading">
            <div className="message-header">
              <span className="message-type">AI</span>
            </div>
            <div className="message-content">
              <span className="loading-indicator">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="chat-input"
        />
        <button
          type="submit"
          className="button primary chat-send"
          disabled={!message.trim() || isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
