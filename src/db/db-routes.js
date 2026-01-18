const { client } = require('./db');
const { ObjectId } = require('mongodb');
const OpenAI = require('openai');

// Hardcoded userId for now (as mentioned in requirements)
const HARDCODED_USER_ID = 'demo';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
    const chats = await db.collection('chats')
      .find({ projectId: projectId })
      .sort({ lastUpdated: -1 }) // Sort by most recent first
      .toArray();
    
    // Transform to match schema
    const formattedChats = chats.map(chat => ({
      id: chat._id.toString(),
      projectId: chat.projectId,
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

// ==================== AI CHAT ====================

// Helper function to build conversation history from a node upwards through the tree
async function buildConversationHistory(db, nodeId) {
  const history = [];
  let currentId = nodeId;

  while (currentId) {
    const node = await db.collection('nodes').findOne({ _id: new ObjectId(currentId) });
    if (!node) break;

    history.unshift({
      role: node.type === 'USER' ? 'user' : 'assistant',
      content: node.content
    });

    currentId = node.parentId;
  }

  return history;
}

// POST /api/chat/completion - Get AI response for a message
async function getChatCompletion(req, res) {
  try {
    console.log("Getting AI chat completion");
    const { chatId, parentId, userMessage } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    if (!ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chatId' });
    }

    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    const db = await getDb();

    // Verify chat exists
    const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Build conversation history from parent node upwards
    let conversationHistory = [];
    if (parentId && ObjectId.isValid(parentId)) {
      conversationHistory = await buildConversationHistory(db, parentId);
    }

    // Add the new user message to history
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Create user node first
    const userNode = {
      chatId: chatId,
      parentId: parentId || null,
      type: 'USER',
      content: userMessage,
      isFlagged: false,
      timestamp: new Date().toISOString(),
      metadata: {}
    };

    const userNodeResult = await db.collection('nodes').insertOne(userNode);
    const userNodeId = userNodeResult.insertedId.toString();

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant designed to help users brainstorm and develop ideas. Be creative, thoughtful, and encourage exploration of different possibilities.'
        },
        ...conversationHistory
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0].message.content;

    // Create AI response node
    const aiNode = {
      chatId: chatId,
      parentId: userNodeId,
      type: 'AI',
      content: aiResponse,
      isFlagged: false,
      timestamp: new Date().toISOString(),
      metadata: {
        model: 'gpt-4o-mini',
        tokens: completion.usage
      }
    };

    const aiNodeResult = await db.collection('nodes').insertOne(aiNode);

    // Update chat lastUpdated timestamp
    await db.collection('chats').updateOne(
      { _id: new ObjectId(chatId) },
      { $set: { lastUpdated: new Date().toISOString() } }
    );

    // Return both nodes
    const response = {
      userNode: {
        id: userNodeId,
        chatId: userNode.chatId,
        parentId: userNode.parentId,
        type: userNode.type,
        content: userNode.content,
        isFlagged: userNode.isFlagged,
        timestamp: userNode.timestamp,
        metadata: userNode.metadata
      },
      aiNode: {
        id: aiNodeResult.insertedId.toString(),
        chatId: aiNode.chatId,
        parentId: aiNode.parentId,
        type: aiNode.type,
        content: aiNode.content,
        isFlagged: aiNode.isFlagged,
        timestamp: aiNode.timestamp,
        metadata: aiNode.metadata
      }
    };

    console.log('Created chat completion with nodes:', response);
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating chat completion:', error);
    res.status(500).json({ error: 'Failed to create chat completion', message: error.message });
  }
}

module.exports = {
  getAllProjects,
  createProject,
  getProjectChats,
  createChat,
  getChatNodes,
  createNode,
  updateNode,
  getChatCompletion
};
