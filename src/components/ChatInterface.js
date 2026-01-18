import { useState, useEffect, useRef } from 'react';
import './ChatInterface.css';

function ChatInterface({ chatId, chatTitle, nodes, onSendMessage, onToggleFlag, isLoading }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const prevNodesLengthRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only scroll to bottom if new messages were added (length increased)
    // This preserves scroll position when only node properties change (like flagging)
    if (nodes.length > prevNodesLengthRef.current) {
      scrollToBottom();
    }
    prevNodesLengthRef.current = nodes.length;
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
      <div className="chat-header">
        <h2 className="chat-title">{chatTitle || 'Untitled Chat'}</h2>
      </div>
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
                 {node.type === 'AI' && node.parentId !== null && (
                    <button
                      type="button"
                      className={`message-flag ${node.isFlagged ? 'flagged' : ''}`}
                      onClick={() => onToggleFlag(node.id, node.isFlagged)}
                      aria-label={node.isFlagged ? 'Remove checkpoint' : 'Add checkpoint'}
                      title={node.isFlagged ? 'Remove checkpoint' : 'Add checkpoint'}
                    >
                      🏳️
                    </button>
                  )}
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
