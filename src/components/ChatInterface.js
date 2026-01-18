import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatInterface.css';

function ChatInterface({ chatId, chatTitle, nodes, onSendMessage, onToggleFlag, isLoading, onUpdateTitle }) {
  const [message, setMessage] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chatTitle || '');
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const titleInputRef = useRef(null);
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

  // Update editedTitle when chatTitle prop changes
  useEffect(() => {
    setEditedTitle(chatTitle || '');
  }, [chatTitle]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setEditedTitle(chatTitle || '');
  };

  const handleTitleSave = async () => {
    if (!editedTitle.trim()) {
      setEditedTitle(chatTitle || '');
      setIsEditingTitle(false);
      return;
    }

    if (editedTitle.trim() === chatTitle) {
      setIsEditingTitle(false);
      return;
    }

    setIsUpdatingTitle(true);
    try {
      if (onUpdateTitle) {
        await onUpdateTitle(editedTitle.trim());
      }
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
      alert(error.message || 'Failed to update title');
      setEditedTitle(chatTitle || '');
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleTitleCancel = () => {
    setEditedTitle(chatTitle || '');
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTitleCancel();
    }
  };

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
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            disabled={isUpdatingTitle}
            className="chat-title-input"
            maxLength={100}
          />
        ) : (
          <h2 
            className="chat-title editable" 
            onClick={handleTitleClick}
            title="Click to edit title"
          >
            {chatTitle || 'Untitled Chat'}
          </h2>
        )}
      </div>
      <div className="chat-messages">
        {nodes.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          nodes.map((node) => {
            // Only show flag for AI messages that are not root messages
            const canFlag = node.type === 'AI' && node.parentId !== null;
            
            return (
              <div key={node.id} className={`message ${node.type.toLowerCase()}`}>
                <div className="message-header">
                  <span className="message-type">{node.type}</span>
                  {canFlag && (
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
                <div className="message-content">
                  <ReactMarkdown>{node.content}</ReactMarkdown>
                </div>
              </div>
            );
          })
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
