// Load environment variables first
// dotenv will automatically look for .env in the current working directory
// (which should be the nwhacks folder when running npm run server)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectChats,
  createChat,
  updateChat,
  deleteChat,
  getChatNodes,
  createNode,
  updateNode,
  generateAIMessage
} = require('./db-routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== PROJECTS ROUTES ====================
// GET /api/projects - List all projects for the hardcoded userId
app.get('/api/projects', getAllProjects);

// POST /api/projects - Create a new project workspace
app.post('/api/projects', createProject);

// PATCH /api/projects/:id - Update a project
app.patch('/api/projects/:id', updateProject);

// DELETE /api/projects/:id - Delete a project and all its chats and nodes (cascade)
app.delete('/api/projects/:id', deleteProject);

// ==================== CHATS ROUTES ====================
// GET /api/projects/:id/chats - Get all chat sessions belonging to a project
app.get('/api/projects/:id/chats', getProjectChats);

// POST /api/chats - Initialize a new chat session
app.post('/api/chats', createChat);

// PATCH /api/chats/:id - Update a chat
app.patch('/api/chats/:id', updateChat);

// DELETE /api/chats/:id - Delete a chat and all its nodes (cascade)
app.delete('/api/chats/:id', deleteChat);

// ==================== NODES ROUTES ====================
// GET /api/chats/:id/nodes - Returns nodes for a chat in D3 format
app.get('/api/chats/:id/nodes', getChatNodes);

// POST /api/nodes - Create a new node
app.post('/api/nodes', createNode);

// PATCH /api/nodes/:id - Toggle flags or update content
app.patch('/api/nodes/:id', updateNode);

// ==================== AI MESSAGE ROUTES ====================
// POST /api/messages/ai - Generate AI response using Gemini
app.post('/api/messages/ai', generateAIMessage);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
