import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';

export default function ChatInterface({ tree, onSendMessage, loading }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const messages = tree.getCurrentPath().filter(node => node.role !== 'system');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>Idea Chat</h2>
        <p>Brainstorm and explore ideas with branching conversations</p>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>Start a conversation</h3>
            <p>Share your ideas and explore different directions</p>
          </div>
        ) : (
          messages.map((node) => (
            <div key={node.id} className={`message ${node.role}`}>
              <div className="message-role">
                {node.role === 'user' ? 'You' : 'AI'}
              </div>
              <div className="message-content">{node.message}</div>
              {node.children.length > 1 && (
                <div className="branch-indicator">
                  {node.children.length} branches from here
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="message assistant">
            <div className="message-role">AI</div>
            <div className="message-content typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Share your idea..."
          disabled={loading}
          className="message-input"
        />
        <button type="submit" disabled={loading || !input.trim()} className="send-button">
          Send
        </button>
      </form>
    </div>
  );
}
