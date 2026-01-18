/**
 * Database Routes
 * 
 * This file contains all API route handlers for the MongoDB database.
 * All routes follow the schemas defined in ./schemas.js
 * 
 * Collections:
 * - projects: Project workspaces
 * - chats: Chat sessions belonging to projects
 * - nodes: Message nodes belonging to chats
 * 
 * Cascade Deletion:
 * - Deleting a project deletes all its chats and their nodes
 * - Deleting a chat deletes all its nodes
 */

const { client } = require('./db');
const { ObjectId } = require('mongodb');
const { generateGeminiResponse } = require('./gemini-service');

// Hardcoded userId for now (as mentioned in requirements)
const HARDCODED_USER_ID = 'demo';

// Helper function to get database
async function getDb() {
  await client.connect();
  return client.db("Documents");
}

// ==================== PROJECTS ====================

// GET /api/projects - List all projects for the hardcoded userId
async function getAllProjects(req, res) {
  try {
    console.log("Getting all projects for userId:", HARDCODED_USER_ID);
    const db = await getDb();
    
    // Get all projects (you may want to filter by userId if you add that field)
    const projects = await db.collection('projects').find({}).toArray();
    console.log('Projects:', projects);
    // Transform to match schema (convert _id to id, ensure proper format)
    const formattedProjects = projects.map(project => ({
      id: project._id.toString(),
      name: project.name || '',
      description: project.description || '',
      createdAt: project.createdAt || new Date().toISOString()
    }));
    
    console.log(`Found ${formattedProjects.length} projects`);
    res.json(formattedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects', message: error.message });
  }
}

// POST /api/projects - Create a new project workspace
async function createProject(req, res) {
  try {
    console.log("Creating new project");
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    const db = await getDb();
    const newProject = {
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      userId: HARDCODED_USER_ID // Store userId for future filtering
    };
    
    const result = await db.collection('projects').insertOne(newProject);
    
    const createdProject = {
      id: result.insertedId.toString(),
      name: newProject.name,
      description: newProject.description,
      createdAt: newProject.createdAt
    };
    
    console.log('Created project:', createdProject);
    res.status(201).json(createdProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project', message: error.message });
  }
}

// DELETE /api/projects/:id - Delete a project and all its chats and nodes (cascade)
async function deleteProject(req, res) {
  try {
    const projectId = req.params.id;
    console.log("Deleting project with cascade:", projectId);
    
    if (!ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const db = await getDb();
    
    // Verify project exists
    const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Find all chats for this project (handle both string and ObjectId projectId)
    const projectObjectId = new ObjectId(projectId);
    const chats = await db.collection('chats')
      .find({
        $or: [
          { projectId: projectId },
          { projectId: projectObjectId }
        ]
      })
      .toArray();
    
    console.log(`Found ${chats.length} chats for project ${projectId}`);
    
    let totalNodesDeleted = 0;
    
    // Delete all nodes for each chat (cascade)
    for (const chat of chats) {
      const chatId = chat._id.toString();
      const nodesDeleteResult = await db.collection('nodes').deleteMany({ chatId: chatId });
      totalNodesDeleted += nodesDeleteResult.deletedCount;
      console.log(`Deleted ${nodesDeleteResult.deletedCount} nodes for chat ${chatId}`);
    }
    
    // Delete all chats for this project
    const chatsDeleteResult = await db.collection('chats').deleteMany({
      $or: [
        { projectId: projectId },
        { projectId: projectObjectId }
      ]
    });
    console.log(`Deleted ${chatsDeleteResult.deletedCount} chats for project ${projectId}`);
    
    // Delete the project
    const projectDeleteResult = await db.collection('projects').deleteOne({ _id: new ObjectId(projectId) });
    
    if (projectDeleteResult.deletedCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    console.log(`Successfully deleted project ${projectId}, ${chatsDeleteResult.deletedCount} chats, and ${totalNodesDeleted} nodes`);
    res.json({ 
      message: 'Project and all associated chats and nodes deleted successfully',
      deletedProjectId: projectId,
      deletedChatsCount: chatsDeleteResult.deletedCount,
      deletedNodesCount: totalNodesDeleted
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project', message: error.message });
  }
}

// ==================== CHATS ====================

// GET /api/projects/:id/chats - Get all chat sessions belonging to a project
async function getProjectChats(req, res) {
  try {
    const projectId = req.params.id;
    console.log("Getting chats for project:", projectId);
    
    if (!ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const db = await getDb();
    
    // Query for chats where projectId matches either as string or ObjectId
    // This handles both cases since the schema allows both types
    const projectObjectId = new ObjectId(projectId);
    const chats = await db.collection('chats')
      .find({
        $or: [
          { projectId: projectId },           // Match as string
          { projectId: projectObjectId }       // Match as ObjectId
        ]
      })
      .sort({ lastUpdated: -1 }) // Sort by most recent first
      .toArray();
    
    // Transform to match schema
    const formattedChats = chats.map(chat => ({
      id: chat._id.toString(),
      projectId: typeof chat.projectId === 'object' ? chat.projectId.toString() : chat.projectId,
      title: chat.title || '',
      lastUpdated: chat.lastUpdated || new Date().toISOString()
    }));
    
    console.log(`Found ${formattedChats.length} chats for project ${projectId}`);
    res.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats', message: error.message });
  }
}

// POST /api/chats - Initialize a new chat session
async function createChat(req, res) {
  try {
    console.log("Creating new chat");
    const { projectId, title } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    if (!ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: 'Invalid projectId' });
    }
    
    const db = await getDb();
    
    // Verify project exists
    const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const newChat = {
      projectId: projectId,
      title: title || 'New Chat',
      lastUpdated: new Date().toISOString()
    };
    
    const result = await db.collection('chats').insertOne(newChat);
    
    const createdChat = {
      id: result.insertedId.toString(),
      projectId: newChat.projectId,
      title: newChat.title,
      lastUpdated: newChat.lastUpdated
    };
    
    console.log('Created chat:', createdChat);
    res.status(201).json(createdChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat', message: error.message });
  }
}

// DELETE /api/chats/:id - Delete a chat and all its nodes (cascade)
async function deleteChat(req, res) {
  try {
    const chatId = req.params.id;
    console.log("Deleting chat with cascade:", chatId);
    
    if (!ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }
    
    const db = await getDb();
    
    // Verify chat exists
    const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Delete all nodes for this chat (cascade)
    const nodesDeleteResult = await db.collection('nodes').deleteMany({ chatId: chatId });
    console.log(`Deleted ${nodesDeleteResult.deletedCount} nodes for chat ${chatId}`);
    
    // Delete the chat
    const chatDeleteResult = await db.collection('chats').deleteOne({ _id: new ObjectId(chatId) });
    
    if (chatDeleteResult.deletedCount === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    console.log(`Successfully deleted chat ${chatId} and ${nodesDeleteResult.deletedCount} associated nodes`);
    res.json({ 
      message: 'Chat and all associated nodes deleted successfully',
      deletedChatId: chatId,
      deletedNodesCount: nodesDeleteResult.deletedCount
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat', message: error.message });
  }
}

// ==================== NODES ====================

// GET /api/chats/:id/nodes - Returns a sorted array of nodes for a chat (D3 format)
async function getChatNodes(req, res) {
  try {
    const chatId = req.params.id;
    console.log("Getting nodes for chat:", chatId);
    
    if (!ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }
    
    const db = await getDb();
    
    // Get all nodes for this chat, sorted by timestamp
    const nodes = await db.collection('nodes')
      .find({ chatId: chatId })
      .sort({ timestamp: 1 }) // Chronological order
      .toArray();

    console.log("Nodes:", nodes);
    
    // Transform to match schema
    const formattedNodes = nodes.map(node => ({
      id: node._id.toString(),
      chatId: node.chatId,
      parentId: node.parentId || null,
      type: node.type || 'USER',
      content: node.content || '',
      isFlagged: node.isFlagged || false,
      timestamp: node.timestamp || new Date().toISOString(),
      metadata: node.metadata || {}
    }));
    
    // Generate D3 links array from parentId relationships
    const links = formattedNodes
      .filter(node => node.parentId !== null)
      .map(node => ({
        source: node.parentId,
        target: node.id
      }));
    
    // D3 Payload format
    const d3Payload = {
      nodes: formattedNodes,
      links: links
    };
    
    console.log(`Found ${formattedNodes.length} nodes and ${links.length} links for chat ${chatId}`);
    res.json(d3Payload);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    res.status(500).json({ error: 'Failed to fetch nodes', message: error.message });
  }
}

// POST /api/nodes - Create a new node
async function createNode(req, res) {
  try {
    console.log("Creating new node");
    const { chatId, parentId, type, content, metadata } = req.body;
    
    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }
    
    if (!ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chatId' });
    }
    
    if (!type || !['USER', 'AI'].includes(type)) {
      return res.status(400).json({ error: 'type must be either "USER" or "AI"' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }
    
    // Validate parentId if provided
    if (parentId && !ObjectId.isValid(parentId)) {
      return res.status(400).json({ error: 'Invalid parentId' });
    }
    
    const db = await getDb();
    
    // Verify chat exists
    const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Verify parent node exists if parentId is provided
    if (parentId) {
      const parent = await db.collection('nodes').findOne({ _id: new ObjectId(parentId) });
      if (!parent) {
        return res.status(404).json({ error: 'Parent node not found' });
      }
    }
    
    const newNode = {
      chatId: chatId,
      parentId: parentId || null,
      type: type,
      content: content,
      isFlagged: false,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };
    
    const result = await db.collection('nodes').insertOne(newNode);
    
    const createdNode = {
      id: result.insertedId.toString(),
      chatId: newNode.chatId,
      parentId: newNode.parentId,
      type: newNode.type,
      content: newNode.content,
      isFlagged: newNode.isFlagged,
      timestamp: newNode.timestamp,
      metadata: newNode.metadata
    };
    
    console.log('Created node:', createdNode);
    res.status(201).json(createdNode);
  } catch (error) {
    console.error('Error creating node:', error);
    res.status(500).json({ error: 'Failed to create node', message: error.message });
  }
}

// PATCH /api/nodes/:id - Toggle flags or update content
async function updateNode(req, res) {
  try {
    const nodeId = req.params.id;
    console.log("Updating node:", nodeId);
    
    if (!ObjectId.isValid(nodeId)) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }
    
    const db = await getDb();
    const { isFlagged, content, metadata } = req.body;
    
    // Build update object with only provided fields
    const updateFields = {};
    if (typeof isFlagged === 'boolean') {
      updateFields.isFlagged = isFlagged;
    }
    if (content !== undefined) {
      updateFields.content = content;
    }
    if (metadata !== undefined) {
      updateFields.metadata = { ...metadata };
    }
    
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const result = await db.collection('nodes').findOneAndUpdate(
      { _id: new ObjectId(nodeId) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const updatedNode = {
      id: result.value._id.toString(),
      chatId: result.value.chatId,
      parentId: result.value.parentId || null,
      type: result.value.type,
      content: result.value.content,
      isFlagged: result.value.isFlagged || false,
      timestamp: result.value.timestamp,
      metadata: result.value.metadata || {}
    };
    
    console.log('Updated node:', updatedNode);
    res.json(updatedNode);
  } catch (error) {
    console.error('Error updating node:', error);
    res.status(500).json({ error: 'Failed to update node', message: error.message });
  }
}

// POST /api/messages/ai - Generate AI response using Gemini
async function generateAIMessage(req, res) {
  try {
    console.log("Generating AI response with Gemini");
    const { chatId, userMessage } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    if (!ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chatId' });
    }

    const db = await getDb();

    // Verify chat exists
    const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Get conversation history from the database (exclude the current user message)
    const nodes = await db.collection('nodes')
      .find({ chatId: chatId })
      .sort({ timestamp: 1 })
      .toArray();

    // Build conversation history for Gemini (only past messages, not the current one)
    const conversationHistory = nodes.map(node => ({
      role: node.type === 'USER' ? 'user' : 'model',
      content: node.content
    }));

    console.log('Conversation history length:', conversationHistory.length);
    console.log('User message:', userMessage);

    // Generate AI response using Gemini
    const aiResponse = await generateGeminiResponse(userMessage, conversationHistory);

    console.log('Generated AI response:', aiResponse);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error generating AI message:', error);
    res.status(500).json({ error: 'Failed to generate AI response', message: error.message });
  }
}

module.exports = {
  getAllProjects,
  createProject,
  deleteProject,
  getProjectChats,
  createChat,
  deleteChat,
  getChatNodes,
  createNode,
  updateNode,
  generateAIMessage
};
