import { useMemo, useState, useEffect, useCallback } from 'react';
import './App.css';
import CreateProjectModal from './components/CreateProjectModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import ChatInterface from './components/ChatInterface';
import VersionControlTimeline from './pages/VersionControlTimeline';

const HOME_FEATURES = [
  {
    title: 'Save points',
    body: 'Capture checkpoints mid-convo so you can branch later without losing context.',
  },
  {
    title: 'Branch boldly',
    body: 'Fork new directions in parallel and explore ideas like GitFlow for chats.',
  },
  {
    title: 'Compare + merge',
    body: 'Line up outcomes, keep the best path, and jump back to any version instantly.',
  },
];

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [view, setView] = useState('home'); // 'home' | 'projects' | 'projectDetail'
  const [isAuthed, setIsAuthed] = useState(false);
  const [authEmail, setAuthEmail] = useState('demo@thoughttree.ai');
  const [authPassword, setAuthPassword] = useState('demo123');
  const [authError, setAuthError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [projectPage, setProjectPage] = useState('chat'); // 'chat' | 'history'
  
  // State for projects, chats, and nodes
  const [projects, setProjects] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [nodes, setNodes] = useState([]); // Currently active path nodes (displayed in chat)
  const [allNodes, setAllNodes] = useState([]); // All nodes for the graph
  const [currentLeafNodeId, setCurrentLeafNodeId] = useState(null); // Track the current "end" of conversation
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingNodes, setLoadingNodes] = useState(false);

  // State for project creation modal
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState('');

  // State for chat creation
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // State for sending messages
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // State for delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for editing project names
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editedProjectName, setEditedProjectName] = useState('');
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  // API Helper Functions
  const fetchProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      console.log('Calling fetchProjects, API URL:', `${API_BASE_URL}/projects`);
      const response = await fetch(`${API_BASE_URL}/projects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      console.log('Projects fetched:', data);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchProjectChats = async (projectId) => {
    try {
      setLoadingChats(true);
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/chats`);
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      setChats(data);
      return data;
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
      return [];
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchChatNodes = async (chatId) => {
    try {
      setLoadingNodes(true);
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/nodes`);
      if (!response.ok) {
        throw new Error('Failed to fetch nodes');
      }
      const data = await response.json();
      setAllNodes(data.nodes || []);
      
      // Build the active path (from root to the most recent leaf)
      const activePath = buildActivePath(data.nodes || []);
      setNodes(activePath);
      
      // Set the current leaf node
      if (activePath.length > 0) {
        setCurrentLeafNodeId(activePath[activePath.length - 1].id);
      } else {
        setCurrentLeafNodeId(null);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching nodes:', error);
      setNodes([]);
      setAllNodes([]);
      return { nodes: [], links: [] };
    } finally {
      setLoadingNodes(false);
    }
  };

  // Build the active path from root to a specific leaf node
  const buildActivePath = (allNodes, leafNodeId = null) => {
    if (!allNodes || allNodes.length === 0) return [];
    
    // If no leaf specified, find the most recent leaf node
    let targetLeafId = leafNodeId;
    if (!targetLeafId) {
      // Find the most recent node (by timestamp)
      const sortedNodes = [...allNodes].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      targetLeafId = sortedNodes[0]?.id;
    }
    
    // Build path from leaf back to root
    const path = [];
    let currentId = targetLeafId;
    
    while (currentId) {
      const node = allNodes.find(n => n.id === currentId);
      if (!node) break;
      path.unshift(node); // Add to beginning of array
      currentId = node.parentId;
    }
    
    return path;
  };

  // Auto-load projects when authenticated and on home or projects page
  useEffect(() => {
    if (isAuthed && (view === 'home' || view === 'projects')) {
      console.log('Fetching projects - isAuthed:', isAuthed, 'view:', view);
      fetchProjects();
    }
  }, [isAuthed, view, fetchProjects]);

  // Load nodes when chat is selected
  useEffect(() => {
    if (selectedChatId) {
      fetchChatNodes(selectedChatId);
    } else {
      setNodes([]);
      setAllNodes([]);
      setCurrentLeafNodeId(null);
    }
  }, [selectedChatId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const currentProjectTitle = useMemo(() => {
    if (selectedProject) return selectedProject.name;
    if (selectedProjectId === 'new') return 'New Project';
    return null;
  }, [selectedProject, selectedProjectId]);

  const showProjects = () => {
    setView('home');
    setSelectedProjectId(null);
    setExpandedProjectId(null);
    setSelectedChatId(null);
    setNodes([]);
    setChats([]);
  };

  const goHome = () => {
    setView('home');
    setSelectedProjectId(null);
    setExpandedProjectId(null);
    setProjectPage('chat');
    setSelectedChatId(null);
    setNodes([]);
    setChats([]);
  };

  const goToProject = async (projectId) => {
    // Toggle expansion if clicking the same project
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      setSelectedProjectId(null);
      setSelectedChatId(null);
      setNodes([]);
      setChats([]);
      return;
    }
    
    setSelectedProjectId(projectId);
    setExpandedProjectId(projectId);
    setView('projectDetail');
    setProjectPage('chat');
    setSelectedChatId(null);
    setNodes([]);
    
    // Fetch chats for the project
    const chatsData = await fetchProjectChats(projectId);
    
    // Auto-select the first chat if any exist
    if (chatsData && chatsData.length > 0) {
      setSelectedChatId(chatsData[0].id);
    }
  };

  const selectChat = (chatId) => {
    setSelectedChatId(chatId);
    setProjectPage('chat');
  };

  const createNewProject = () => {
    setShowCreateProjectModal(true);
  };

  // API Functions
  const createProjectAPI = async (name, description) => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }
    return response.json();
  };

  const createChatAPI = async (projectId, title) => {
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, title }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create chat');
    }
    return response.json();
  };

  const createNodeAPI = async (chatId, type, content, parentId) => {
    const response = await fetch(`${API_BASE_URL}/nodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId, type, content, parentId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create node');
    }
    return response.json();
  };

  const deleteProjectAPI = async (projectId) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }
    return response.json();
  };

  const deleteChatAPI = async (chatId) => {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete chat');
    }
    return response.json();
  };

  const toggleNodeFlagAPI = async (nodeId, isFlagged) => {
    const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isFlagged }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle flag');
    }
    return response.json();
  };

  const updateChatAPI = async (chatId, title) => {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update chat');
    }
    return response.json();
  };

  const updateProjectAPI = async (projectId, name, description) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project');
    }
    return response.json();
  };

  // Generate AI Response using Gemini API
  const generateAIResponseAPI = async (chatId, userMessage) => {
    try {
      console.log('Calling Gemini API...', { chatId, userMessage });
      const response = await fetch(`${API_BASE_URL}/messages/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId, userMessage }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('API error response:', error);
        throw new Error(error.error || error.message || 'Failed to generate AI response');
      }

      const data = await response.json();
      console.log('AI response received:', data);
      return data.response;
    } catch (error) {
      console.error('Error in generateAIResponseAPI:', error);
      throw error;
    }
  };

  // Handlers
  const handleCreateProject = async (name, description) => {
    setIsCreatingProject(true);
    setCreateProjectError('');
    try {
      const newProject = await createProjectAPI(name, description);
      setShowCreateProjectModal(false);
      // Refresh projects list
      await fetchProjects();
      // Navigate to the new project
      await goToProject(newProject.id);
    } catch (error) {
      console.error('Error creating project:', error);
      setCreateProjectError(error.message || 'Failed to create project');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleCreateNewChat = async () => {
    if (!selectedProjectId || selectedProjectId === 'new') {
      return;
    }
    setIsCreatingChat(true);
    try {
      const newChat = await createChatAPI(selectedProjectId, 'New Chat');
      // Add chat to local state
      setChats(prev => [newChat, ...prev]);
      // Auto-select the new chat
      setSelectedChatId(newChat.id);
      // Fetch nodes for the new chat (will be empty initially)
      await fetchChatNodes(newChat.id);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert(error.message || 'Failed to create chat');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSendMessage = async (messageContent) => {
    if (!selectedChatId || !messageContent.trim()) {
      return;
    }
    setIsSendingMessage(true);
    try {
      // Use the current leaf node as parent (this is where we're branching from)
      const parentId = currentLeafNodeId;
      const isFirstMessage = !parentId;

      // Create USER node (backend will auto-name chat if this is first message)
      const userNode = await createNodeAPI(selectedChatId, 'USER', messageContent, parentId);

      // Immediately add the user node to the UI for instant feedback
      const newUserNode = {
        id: userNode.id,
        chatId: selectedChatId,
        parentId: parentId,
        type: 'USER',
        content: messageContent,
        isFlagged: false,
        timestamp: new Date().toISOString(),
        metadata: {}
      };
      
      setNodes(prev => [...prev, newUserNode]);
      setAllNodes(prev => [...prev, newUserNode]);
      setCurrentLeafNodeId(userNode.id);

      // If this is the first message, refresh chats after a delay to get the auto-generated title
      // The title generation happens asynchronously in the backend, so we poll for updates
      if (isFirstMessage && selectedProjectId) {
        // Refresh immediately (in case it's fast)
        fetchProjectChats(selectedProjectId);
        
        // Also refresh after a delay to catch the async title update
        setTimeout(() => {
          fetchProjectChats(selectedProjectId);
        }, 2000); // 2 second delay should be enough for Gemini to generate the title
      }

      // Generate AI response using Gemini API
      const aiResponse = await generateAIResponseAPI(selectedChatId, messageContent);

      // Create AI node with the USER node as parent
      const aiNode = await createNodeAPI(selectedChatId, 'AI', aiResponse, userNode.id);

      // Refresh nodes to get the complete state including the AI response
      await fetchChatNodes(selectedChatId);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message');
      // Refresh to show correct state if there was an error
      await fetchChatNodes(selectedChatId);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUpdateChatTitle = async (newTitle) => {
    if (!selectedChatId) {
      return;
    }
    try {
      const updatedChat = await updateChatAPI(selectedChatId, newTitle);
      // Update local chats state
      setChats(prev => prev.map(chat => 
        chat.id === selectedChatId ? updatedChat : chat
      ));
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  };

  const handleStartEditProject = (projectId, currentName) => {
    setEditingProjectId(projectId);
    setEditedProjectName(currentName);
  };

  const handleSaveProjectName = async (projectId) => {
    if (!editedProjectName.trim()) {
      const project = projects.find(p => p.id === projectId);
      setEditedProjectName(project?.name || '');
      setEditingProjectId(null);
      return;
    }

    if (editedProjectName.trim() === projects.find(p => p.id === projectId)?.name) {
      setEditingProjectId(null);
      return;
    }

    setIsUpdatingProject(true);
    try {
      const project = projects.find(p => p.id === projectId);
      const updatedProject = await updateProjectAPI(projectId, editedProjectName.trim(), project?.description);
      // Update local projects state
      setProjects(prev => prev.map(p => 
        p.id === projectId ? updatedProject : p
      ));
      setEditingProjectId(null);
    } catch (error) {
      console.error('Error updating project name:', error);
      alert(error.message || 'Failed to update project name');
      const project = projects.find(p => p.id === projectId);
      setEditedProjectName(project?.name || '');
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const handleCancelEditProject = () => {
    setEditingProjectId(null);
    setEditedProjectName('');
  };

  const handleToggleFlag = async (nodeId, currentFlagState) => {
    try {
      const newFlagState = !currentFlagState;
      const updatedNode = await toggleNodeFlagAPI(nodeId, newFlagState);
      
      // Update local state to reflect the change
      setNodes(prev => prev.map(node => 
        node.id === nodeId 
          ? { ...node, isFlagged: updatedNode.isFlagged }
          : node
      ));
    } catch (error) {
      console.error('Error toggling flag:', error);
      alert(error.message || 'Failed to toggle flag');
    }
  };

  const handleRewindToMessage = async (nodeId) => {
    if (!selectedChatId) return;
    
    try {
      // Build the active path up to and including the selected node
      const newActivePath = buildActivePath(allNodes, nodeId);
      
      // Update local state
      setNodes(newActivePath);
      setCurrentLeafNodeId(nodeId);

      console.log('Rewound to node:', nodeId);
    } catch (error) {
      console.error('Error rewinding to node:', error);
    }
  };

  const handleLogin = (e) => {
    e?.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Enter an email and password to continue the demo.');
      return;
    }
    setAuthError('');
    setIsAuthed(true);
    goHome();
  };

  const handleLogout = () => {
    setIsAuthed(false);
    setSelectedProjectId(null);
    setProjectPage('chat');
    setView('home');
  };

  // Delete handlers
  const handleDeleteProject = async (projectId) => {
    try {
      // Fetch project details
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      // Fetch chats for the project to count them
      const chatsData = await fetchProjectChats(projectId);
      let totalNodes = 0;

      // Count nodes for each chat
      for (const chat of chatsData) {
        const nodesData = await fetchChatNodes(chat.id);
        totalNodes += (nodesData.nodes || []).length;
      }

      // Open modal with deletion details
      setDeleteTarget({
        type: 'project',
        id: projectId,
        name: project.name,
        chatCount: chatsData.length,
        nodeCount: totalNodes,
      });
      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error preparing project deletion:', error);
      alert('Failed to load project details for deletion');
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      // Fetch chat details
      const chat = chats.find(c => c.id === chatId);
      if (!chat) return;

      // Count nodes for the chat
      const nodesData = await fetchChatNodes(chatId);
      const nodeCount = (nodesData.nodes || []).length;

      // Open modal with deletion details
      setDeleteTarget({
        type: 'chat',
        id: chatId,
        name: chat.title || 'Untitled Chat',
        nodeCount: nodeCount,
      });
      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error preparing chat deletion:', error);
      alert('Failed to load chat details for deletion');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'project') {
        // Delete project
        await deleteProjectAPI(deleteTarget.id);

        // Remove from local state
        setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));

        // If deleting the current project, clear selection
        if (selectedProjectId === deleteTarget.id) {
          setSelectedProjectId(null);
          setExpandedProjectId(null);
          setView('home');
          setSelectedChatId(null);
          setNodes([]);
          setChats([]);
        }

        // Refresh projects list
        await fetchProjects();
      } else {
        // Delete chat
        await deleteChatAPI(deleteTarget.id);

        // Calculate remaining chats before state update
        const remainingChats = chats.filter(c => c.id !== deleteTarget.id);

        // Remove from local state
        setChats(prev => prev.filter(c => c.id !== deleteTarget.id));

        // If deleting the current chat, select another chat or show empty state
        if (selectedChatId === deleteTarget.id) {
          if (remainingChats.length > 0) {
            setSelectedChatId(remainingChats[0].id);
          } else {
            setSelectedChatId(null);
            setNodes([]);
          }
        }

        // Refresh chats list
        if (selectedProjectId) {
          await fetchProjectChats(selectedProjectId);
        }
      }

      // Close modal
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting:', error);
      alert(error.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const navItems = useMemo(() => {
    const items = [
      { id: 'home', label: 'Home', onClick: goHome, active: view === 'home' },
      { id: 'projects-title', label: 'Projects', kind: 'title' },
    ];

    // Always show all projects in expanded dropdown
    if (loadingProjects) {
      items.push({ id: 'projects-loading', label: 'Loading projects...', kind: 'disabled' });
    } else {
      // Add "Create a new project" button at the start of projects list
      items.push({ 
        id: 'create', 
        label: '+ Create a new project', 
        onClick: createNewProject, 
        kind: 'create' 
      });

      projects.forEach((project) => {
        const isExpanded = expandedProjectId === project.id;
        const isSelected = selectedProjectId === project.id;
        const isEditing = editingProjectId === project.id;
        
        // Add project item
        items.push({
          id: project.id,
          label: project.name,
          onClick: isEditing ? undefined : () => goToProject(project.id),
          active: isSelected,
          kind: 'project',
          expanded: isExpanded,
          onDelete: () => handleDeleteProject(project.id),
          isEditing: isEditing,
          onEdit: () => handleStartEditProject(project.id, project.name),
          onSave: () => handleSaveProjectName(project.id),
          onCancel: handleCancelEditProject,
        });

        // If this project is expanded, show its chats nested underneath
        if (isExpanded) {
          items.push({ id: `${project.id}-chats-title`, label: 'Chats', kind: 'title', nested: true });

          // Add "New Chat" button at the start of chats list
          if (selectedProjectId && selectedProjectId !== 'new') {
            items.push({
              id: `${project.id}-new-chat`,
              label: '+ New Chat',
              onClick: handleCreateNewChat,
              active: false,
              kind: 'create',
              nested: true,
            });
          }

          if (loadingChats) {
            items.push({ 
              id: `${project.id}-chats-loading`, 
              label: 'Loading chats...', 
              kind: 'disabled',
              nested: true 
            });
          } else if (chats.length === 0) {
            items.push({ 
              id: `${project.id}-chats-empty`, 
              label: 'No chats available', 
              kind: 'disabled',
              nested: true 
            });
          } else {
            chats.forEach((chat) => {
              items.push({
                id: chat.id,
                label: chat.title || 'Untitled Chat',
                onClick: () => selectChat(chat.id),
                active: selectedChatId === chat.id,
                kind: 'chat',
                nested: true,
                onDelete: () => handleDeleteChat(chat.id),
              });
            });
          }

          items.push({
            id: `${project.id}-history`,
            label: 'View history',
            onClick: () => setProjectPage('history'),
            active: projectPage === 'history',
            nested: true,
          });
        }
      });
    }

    return items;
  }, [
    view, 
    projectPage, 
    goHome, 
    chats, 
    loadingChats, 
    loadingProjects,
    selectedChatId, 
    selectedProjectId, 
    expandedProjectId,
    projects, 
    editingProjectId,
    handleDeleteProject, 
    handleDeleteChat,
    handleCreateNewChat,
    selectChat,
    goToProject,
    createNewProject,
    handleStartEditProject,
    handleSaveProjectName,
    handleCancelEditProject
  ]);

  const renderAuth = () => (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/LogoT.png" alt="ThoughTree logo" />
        </div>
        <p className="muted small">Please log in to continue.</p>
        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="demo@thoughttree.ai"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="demo123"
            />
          </label>
          {authError && <p className="auth-error">{authError}</p>}
          <button type="submit" className="button primary full">Enter demo</button>
        </form>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="home">
      <div className="hero">
        <div className="hero-header">
          <div className="logo-mark">
            <img src="/LogoT.png" alt="ThoughtTree branch logo" />
          </div>
          <div>
            <h1>Conversations that branch like code.</h1>
          </div>
        </div>
        <p className="lead">
          Our AI chat treats conversations like version-controlled code. Drop save points, branch off,
          compare outcomes, and return to any version instantly — perfect for brainstorming, learning, writing,
          and problem-solving.
        </p>
        <div className="pill-row">
          <span className="pill">Save</span>
          <span className="pill">Branch</span>
          <span className="pill">Compare</span>
          <span className="pill">Merge</span>
        </div>
        <div className="cta-row">
          <button className="button primary" onClick={createNewProject}>
            Start a new project
          </button>
          <button className="button ghost" onClick={showProjects}>
            Browse projects
          </button>
        </div>
      </div>

      <div className="home-grid">
        {HOME_FEATURES.map((item) => (
          <div key={item.title} className="home-card">
            <p className="feature-title">{item.title}</p>
            <p className="muted">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="branch-anim" aria-hidden="true">
        <svg viewBox="0 0 1200 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="branchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c6bff" />
              <stop offset="45%" stopColor="#6ff2d6" />
              <stop offset="80%" stopColor="#ffb347" />
            </linearGradient>
          </defs>
          <path className="branch-path trunk" d="M0 320 C 40 300, 85 260, 140 240" />
          <path
            className="branch-path main"
            d="M140 240 C 220 210, 320 185, 430 190 C 560 195, 700 200, 840 195 C 980 190, 1100 205, 1200 195"
          />
          <path className="branch-path twig1" d="M260 202 C 300 165, 350 140, 400 142" />
          <path className="branch-path twig2" d="M360 192 C 420 240, 470 255, 520 240" />
          <path className="branch-path twig3" d="M520 192 C 570 155, 630 138, 690 145" />
          <path className="branch-path twig4" d="M660 197 C 720 238, 790 255, 850 242" />
          <path className="branch-path twig5" d="M820 195 C 880 160, 940 145, 1000 150" />
          <path className="branch-path twig6" d="M930 198 C 990 232, 1060 244, 1120 232" />

          <path className="branch-path sprig1" d="M400 142 C 420 124, 440 116, 462 120" />
          <path className="branch-path sprig2" d="M520 240 C 545 262, 565 272, 590 265" />
          <path className="branch-path sprig3" d="M690 145 C 712 126, 734 116, 760 122" />
          <path className="branch-path sprig4" d="M850 242 C 870 264, 895 274, 918 268" />
          <path className="branch-path sprig5" d="M1000 150 C 1022 132, 1042 125, 1064 130" />
          <path className="branch-path sprig6" d="M1120 232 C 1144 252, 1168 260, 1190 255" />
        </svg>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="section">
      <p className="eyebrow">Workspace</p>
      <h1>Projects</h1>
      <p className="muted">Select a project from the left navigation to open it or start a new one.</p>
      <div className="panel">
        <div className="placeholder">Use the navigation to pick a project.</div>
      </div>
    </div>
  );

  const renderProjectDetail = () => {
    const selectedChat = chats.find((c) => c.id === selectedChatId);

    if (projectPage === 'chat') {
      if (selectedProjectId === 'new') {
        return (
          <div className="section">
            <div className="placeholder">
              Create a project to start chatting.
            </div>
          </div>
        );
      } else if (selectedChat) {
        return (
          <ChatInterface
            chatId={selectedChat.id}
            chatTitle={selectedChat.title || 'Untitled Chat'}
            nodes={nodes}
            onSendMessage={handleSendMessage}
            onToggleFlag={handleToggleFlag}
            onUpdateTitle={handleUpdateChatTitle}
            isLoading={isSendingMessage}
          />
        );
      } else if (loadingChats) {
        return (
          <div className="section">
            <div className="placeholder">Loading chats...</div>
          </div>
        );
      } else if (chats.length === 0) {
        return (
          <div className="section">
            <div className="placeholder">
              <p>No chats yet. Create a new chat to get started!</p>
              <button
                className="button primary"
                onClick={handleCreateNewChat}
                disabled={isCreatingChat}
                style={{ marginTop: '16px' }}
              >
                {isCreatingChat ? 'Creating...' : 'Create New Chat'}
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="section">
            <div className="placeholder">Select a chat to start messaging</div>
          </div>
        );
      }
    } else {
      // History view
      return (
        <div className="history-view">
          {loadingNodes ? (
            <div className="history-loading">Loading history...</div>
          ) : nodes.length > 0 ? (
            <VersionControlTimeline chatId={selectedChatId} onNodeClick={handleRewindToMessage} currentNodeId={currentLeafNodeId}/>
          ) : (
            <div className="history-empty">No history available for this chat.</div>
          )}
        </div>
      );
    }
  };

  if (!isAuthed) {
    return renderAuth();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo-inline" src="/LogoT.png" alt="ThoughtTree logo" />
        </div>
        <nav className="nav">
          {navItems.map((item) => {
            const classes = ['nav-item'];
            if (item.kind) classes.push(item.kind);
            if (item.active) classes.push('active');
            if (item.expanded) classes.push('expanded');
            if (item.nested) classes.push('nested');

            if (item.kind === 'title') {
              return (
                <div key={item.id} className={classes.join(' ')}>
                  {item.label}
                </div>
              );
            }

            if (item.kind === 'disabled') {
              return (
                <div key={item.id} className={classes.join(' ')}>
                  {item.label}
                </div>
              );
            }

            // Check if item has delete handler (project or chat)
            if (item.onDelete) {
              // If editing, show input field
              if (item.isEditing) {
                return (
                  <div key={item.id} className={classes.join(' ')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                    <input
                      type="text"
                      value={editedProjectName}
                      onChange={(e) => setEditedProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          item.onSave();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          item.onCancel();
                        }
                      }}
                      onBlur={item.onSave}
                      disabled={isUpdatingProject}
                      className="nav-item-input"
                      autoFocus
                      style={{ flex: 1, padding: '4px 8px', fontSize: '14px' }}
                    />
                    <button
                      type="button"
                      className="nav-item-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        item.onCancel();
                      }}
                      aria-label="Cancel editing"
                      title="Cancel editing"
                      disabled={isUpdatingProject}
                    >
                      ✕
                    </button>
                  </div>
                );
              }

              // Regular project/chat item with delete button
              return (
                <button
                  key={item.id}
                  type="button"
                  className={classes.join(' ')}
                  onClick={item.onClick}
                  onContextMenu={(e) => {
                    if (item.kind === 'project') {
                      e.preventDefault();
                      item.onEdit();
                    }
                  }}
                  title={item.kind === 'project' ? 'Right-click to edit' : undefined}
                >
                  <span>{item.label}</span>
                  <button
                    type="button"
                    className="nav-item-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onDelete();
                    }}
                    aria-label={`Delete ${item.label}`}
                    title={`Delete ${item.label}`}
                  >
                    🗑️
                  </button>
                </button>
              );
            }

            return (
              <button
                type="button"
                key={item.id}
                className={classes.join(' ')}
                onClick={item.onClick}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="nav-footer">
          <button className="nav-item danger" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      <main className={`main ${view === 'projectDetail' && (projectPage === 'history' || (projectPage === 'chat' && selectedChatId)) ? 'chat-view' : ''}`}>
        {view === 'home' && renderHome()}
        {view === 'projects' && renderProjects()}
        {view === 'projectDetail' && renderProjectDetail()}
      </main>

      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => {
          setShowCreateProjectModal(false);
          setCreateProjectError('');
        }}
        onCreateProject={handleCreateProject}
        isLoading={isCreatingProject}
        error={createProjectError}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        target={deleteTarget}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default App;
