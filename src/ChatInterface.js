import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from './api';

function ChatInterface({ projectId, projectName, onChatIdChange }) {
  const [chatId, setChatId] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [currentPath, setCurrentPath] = useState([]); // Array of node IDs representing current conversation path
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize chat when component mounts
  useEffect(() => {
    initializeChat();
  }, [projectId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentPath]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get or create chat for this project
      const chats = await api.getProjectChats(projectId);

      let activeChat;
      if (chats.length > 0) {
        // Use most recent chat
        activeChat = chats[0];
      } else {
        // Create new chat
        activeChat = await api.createChat(projectId, `${projectName} Chat`);
      }

      setChatId(activeChat.id);

      // Notify parent component
      if (onChatIdChange) {
        onChatIdChange(activeChat.id);
      }

      // Load existing nodes
      const { nodes: loadedNodes, links: loadedLinks } = await api.getChatNodes(activeChat.id);
      setNodes(loadedNodes);
      setLinks(loadedLinks);

      // Set initial path (find longest path or most recent)
      if (loadedNodes.length > 0) {
        const path = findMainPath(loadedNodes, loadedLinks);
        setCurrentPath(path);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Find the main conversation path (deepest or most recent)
  const findMainPath = (nodeList, linkList) => {
    if (nodeList.length === 0) return [];

    // Build adjacency map
    const children = {};
    nodeList.forEach(node => {
      children[node.id] = [];
    });
    linkList.forEach(link => {
      if (children[link.source]) {
        children[link.source].push(link.target);
      }
    });

    // Find root nodes (no parent)
    const roots = nodeList.filter(node => node.parentId === null);
    if (roots.length === 0) return [];

    // DFS to find deepest path
    const findDeepestPath = (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return [nodeId];
      visited.add(nodeId);

      const childIds = children[nodeId] || [];
      if (childIds.length === 0) return [nodeId];

      // Get paths from all children and pick the deepest
      const childPaths = childIds.map(childId => findDeepestPath(childId, new Set(visited)));
      const deepestChildPath = childPaths.reduce((longest, current) =>
        current.length > longest.length ? current : longest
      , []);

      return [nodeId, ...deepestChildPath];
    };

    // Start from first root
    return findDeepestPath(roots[0].id);
  };

  // Get messages for current path
  const currentMessages = useMemo(() => {
    return currentPath.map(nodeId => nodes.find(n => n.id === nodeId)).filter(Boolean);
  }, [currentPath, nodes]);

  // Get branches at a specific node
  const getBranchesAtNode = (nodeId) => {
    const childLinks = links.filter(link => link.source === nodeId);
    return childLinks.map(link => nodes.find(n => n.id === link.target)).filter(Boolean);
  };

  // Switch to a different branch
  const switchToBranch = (nodeId) => {
    // Find path from root to this node
    const findPathToNode = (targetId) => {
      const path = [];
      let currentId = targetId;

      while (currentId) {
        path.unshift(currentId);
        const node = nodes.find(n => n.id === currentId);
        currentId = node?.parentId;
      }

      return path;
    };

    const newPath = findPathToNode(nodeId);

    // Extend path to include all descendants if this is an old node
    const lastNodeId = newPath[newPath.length - 1];
    const childLinks = links.filter(link => link.source === lastNodeId);

    if (childLinks.length > 0) {
      // If there are children, pick the first one and extend
      const extendedPath = findMainPath(nodes, links);
      const indexInExtended = extendedPath.indexOf(nodeId);
      if (indexInExtended !== -1) {
        setCurrentPath(extendedPath.slice(0, indexInExtended + 1));
        return;
      }
    }

    setCurrentPath(newPath);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !chatId || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const parentId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;

      // Send message and get AI response
      const { userNode, aiNode } = await api.sendMessage(chatId, parentId, inputMessage.trim());

      // Update nodes and links
      const newNodes = [...nodes, userNode, aiNode];
      const newLinks = [...links];

      if (parentId) {
        newLinks.push({ source: parentId, target: userNode.id });
      }
      newLinks.push({ source: userNode.id, target: aiNode.id });

      setNodes(newNodes);
      setLinks(newLinks);

      // Update current path
      setCurrentPath([...currentPath, userNode.id, aiNode.id]);

      setInputMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="chat-interface">
        <div className="error-message">
          <p>Error: {error}</p>
          <button className="button ghost" onClick={initializeChat}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {currentMessages.length === 0 ? (
          <div className="chat-empty">
            <p className="muted">Start a conversation to brainstorm ideas!</p>
          </div>
        ) : (
          <>
            {currentMessages.map((message, index) => {
              const branches = getBranchesAtNode(message.id);
              const isLastInPath = index === currentMessages.length - 1;

              return (
                <div key={message.id}>
                  <div className={`message ${message.type.toLowerCase()}`}>
                    <div className="message-header">
                      <span className="message-author">
                        {message.type === 'USER' ? 'You' : 'AI Assistant'}
                      </span>
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-content">{message.content}</div>
                  </div>

                  {/* Show branches if there are multiple children */}
                  {branches.length > 1 && (
                    <div className="branch-selector">
                      <p className="branch-label">Multiple branches available:</p>
                      <div className="branch-buttons">
                        {branches.map(branch => (
                          <button
                            key={branch.id}
                            className={`branch-option ${currentPath.includes(branch.id) ? 'active' : ''}`}
                            onClick={() => switchToBranch(branch.id)}
                          >
                            <span className="branch-type">{branch.type}</span>
                            <span className="branch-preview">
                              {branch.content.slice(0, 50)}
                              {branch.content.length > 50 ? '...' : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="button primary"
          disabled={!inputMessage.trim() || isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
