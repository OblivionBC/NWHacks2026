// API client for backend communication
const API_BASE = 'http://localhost:3001/api';

export const api = {
  // Projects
  async getAllProjects() {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async createProject(name, description) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  // Chats
  async getProjectChats(projectId) {
    const res = await fetch(`${API_BASE}/projects/${projectId}/chats`);
    if (!res.ok) throw new Error('Failed to fetch chats');
    return res.json();
  },

  async createChat(projectId, title) {
    const res = await fetch(`${API_BASE}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title })
    });
    if (!res.ok) throw new Error('Failed to create chat');
    return res.json();
  },

  // Nodes
  async getChatNodes(chatId) {
    const res = await fetch(`${API_BASE}/chats/${chatId}/nodes`);
    if (!res.ok) throw new Error('Failed to fetch nodes');
    return res.json();
  },

  async createNode(chatId, parentId, type, content, metadata = {}) {
    const res = await fetch(`${API_BASE}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, parentId, type, content, metadata })
    });
    if (!res.ok) throw new Error('Failed to create node');
    return res.json();
  },

  async updateNode(nodeId, updates) {
    const res = await fetch(`${API_BASE}/nodes/${nodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update node');
    return res.json();
  },

  // AI Chat
  async sendMessage(chatId, parentId, userMessage) {
    const res = await fetch(`${API_BASE}/chat/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, parentId, userMessage })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  }
};
