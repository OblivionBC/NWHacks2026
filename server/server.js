import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import Conversation from './models/Conversation.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/chat', async (req, res) => {
  console.log('Received chat request:', { messagesCount: req.body?.messages?.length });
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
    });

    res.json({
      message: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    const errorMessage = error.message || 'Failed to generate response';
    res.status(500).json({ error: errorMessage });
  }
});

// Save conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const { title, nodes, currentNodeId, rootId } = req.body;

    const conversation = new Conversation({
      title,
      nodes: new Map(nodes),
      currentNodeId,
      rootId,
    });

    await conversation.save();
    res.json({ id: conversation._id, message: 'Conversation saved successfully' });
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// Get all conversations
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .select('_id title createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get specific conversation
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const nodesArray = Array.from(conversation.nodes.entries());
    res.json({
      id: conversation._id,
      title: conversation.title,
      nodes: nodesArray,
      currentNodeId: conversation.currentNodeId,
      rootId: conversation.rootId,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Update conversation
app.put('/api/conversations/:id', async (req, res) => {
  try {
    const { title, nodes, currentNodeId, rootId } = req.body;

    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      {
        title,
        nodes: new Map(nodes),
        currentNodeId,
        rootId,
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation updated successfully' });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// Delete conversation
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
  console.log(`Chat endpoint: http://localhost:${port}/api/chat`);
});
