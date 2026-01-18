import React, { useState } from 'react';
import ChatInterface from './ChatInterface.jsx';
import TreeView from './TreeView.jsx';
import { ConversationTree } from './conversationTree.js';
import './App.css';

const API_URL = 'http://localhost:3001';

function App() {
  const [tree] = useState(() => new ConversationTree());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [refreshKey, setRefreshKey] = useState(0);

  const forceUpdate = () => setRefreshKey(prev => prev + 1);

  const sendMessage = async (message) => {
    try {
      setError(null);
      setLoading(true);

      tree.addMessage(message, 'user');
      forceUpdate();

      const messages = tree.getMessagesForAPI();

      console.log('Sending request to:', `${API_URL}/api/chat`);
      console.log('Messages:', messages);

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      tree.addMessage(data.message, 'assistant');
      forceUpdate();
    } catch (err) {
      const errorMessage = err.message.includes('fetch')
        ? 'Cannot connect to server. Make sure the server is running on port 3001.'
        : err.message;
      setError(errorMessage);
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (nodeId) => {
    tree.navigateToNode(nodeId);
    forceUpdate();
    setActiveTab('chat');
  };

  return (
    <div className="app">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button
          className={`tab ${activeTab === 'tree' ? 'active' : ''}`}
          onClick={() => setActiveTab('tree')}
        >
          Tree View
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="content">
        {activeTab === 'chat' ? (
          <ChatInterface tree={tree} onSendMessage={sendMessage} loading={loading} />
        ) : (
          <TreeView tree={tree} onNodeClick={handleNodeClick} />
        )}
      </div>
    </div>
  );
}

export default App;
