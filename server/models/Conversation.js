import mongoose from 'mongoose';

const conversationNodeSchema = new mongoose.Schema({
  id: String,
  message: String,
  role: String,
  parentId: String,
  children: [String],
  timestamp: String,
});

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Untitled Conversation',
  },
  nodes: {
    type: Map,
    of: conversationNodeSchema,
  },
  currentNodeId: String,
  rootId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Conversation', conversationSchema);
