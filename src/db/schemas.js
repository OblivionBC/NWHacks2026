/**
 * Database Schema Definitions
 * 
 * These schemas define the structure of documents stored in MongoDB collections.
 * All routes in db-routes.js should match these schemas.
 */

// ==================== PROJECTS SCHEMA ====================
/**
 * Projects Collection Schema
 * 
 * Database Document:
 * {
 *   _id: ObjectId,
 *   name: string (required),
 *   description: string (default: ''),
 *   createdAt: string (ISO 8601 date string),
 *   userId: string (default: 'demo')
 * }
 * 
 * API Response Format (GET /api/projects, POST /api/projects):
 * {
 *   id: string (ObjectId as string),
 *   name: string,
 *   description: string,
 *   createdAt: string (ISO 8601)
 * }
 * 
 * API Request Format (POST /api/projects):
 * {
 *   name: string (required),
 *   description?: string (optional)
 * }
 */
const PROJECT_SCHEMA = {
  collection: 'projects',
  fields: {
    _id: 'ObjectId',
    name: 'string (required)',
    description: 'string (default: "")',
    createdAt: 'string (ISO 8601)',
    userId: 'string (default: "demo")'
  },
  apiResponse: {
    id: 'string',
    name: 'string',
    description: 'string',
    createdAt: 'string (ISO 8601)'
  },
  apiRequest: {
    name: 'string (required)',
    description: 'string (optional)'
  }
};

// ==================== CHATS SCHEMA ====================
/**
 * Chats Collection Schema
 * 
 * Database Document:
 * {
 *   _id: ObjectId,
 *   projectId: string | ObjectId (can be either type),
 *   title: string (default: 'New Chat'),
 *   lastUpdated: string (ISO 8601 date string)
 * }
 * 
 * API Response Format (GET /api/projects/:id/chats, POST /api/chats):
 * {
 *   id: string (ObjectId as string),
 *   projectId: string,
 *   title: string,
 *   lastUpdated: string (ISO 8601)
 * }
 * 
 * API Request Format (POST /api/chats):
 * {
 *   projectId: string (required, must be valid ObjectId),
 *   title?: string (optional, default: 'New Chat')
 * }
 */
const CHAT_SCHEMA = {
  collection: 'chats',
  fields: {
    _id: 'ObjectId',
    projectId: 'string | ObjectId (can be either type)',
    title: 'string (default: "New Chat")',
    lastUpdated: 'string (ISO 8601)'
  },
  apiResponse: {
    id: 'string',
    projectId: 'string',
    title: 'string',
    lastUpdated: 'string (ISO 8601)'
  },
  apiRequest: {
    projectId: 'string (required, valid ObjectId)',
    title: 'string (optional, default: "New Chat")'
  }
};

// ==================== NODES SCHEMA ====================
/**
 * Nodes Collection Schema
 * 
 * Database Document:
 * {
 *   _id: ObjectId,
 *   chatId: string,
 *   parentId: string | null,
 *   type: 'USER' | 'AI',
 *   content: string (required),
 *   isFlagged: boolean (default: false),
 *   timestamp: string (ISO 8601 date string),
 *   metadata: object (default: {})
 * }
 * 
 * API Response Format (GET /api/chats/:id/nodes):
 * {
 *   nodes: [
 *     {
 *       id: string (ObjectId as string),
 *       chatId: string,
 *       parentId: string | null,
 *       type: 'USER' | 'AI',
 *       content: string,
 *       isFlagged: boolean,
 *       timestamp: string (ISO 8601),
 *       metadata: object
 *     }
 *   ],
 *   links: [
 *     {
 *       source: string (parentId),
 *       target: string (node id)
 *     }
 *   ]
 * }
 * 
 * API Response Format (POST /api/nodes, PATCH /api/nodes/:id):
 * {
 *   id: string,
 *   chatId: string,
 *   parentId: string | null,
 *   type: 'USER' | 'AI',
 *   content: string,
 *   isFlagged: boolean,
 *   timestamp: string (ISO 8601),
 *   metadata: object
 * }
 * 
 * API Request Format (POST /api/nodes):
 * {
 *   chatId: string (required, must be valid ObjectId),
 *   parentId?: string (optional, must be valid ObjectId if provided),
 *   type: 'USER' | 'AI' (required),
 *   content: string (required),
 *   metadata?: object (optional)
 * }
 * 
 * API Request Format (PATCH /api/nodes/:id):
 * {
 *   isFlagged?: boolean (optional),
 *   content?: string (optional),
 *   metadata?: object (optional)
 * }
 */
const NODE_SCHEMA = {
  collection: 'nodes',
  fields: {
    _id: 'ObjectId',
    chatId: 'string',
    parentId: 'string | null',
    type: "'USER' | 'AI'",
    content: 'string (required)',
    isFlagged: 'boolean (default: false)',
    timestamp: 'string (ISO 8601)',
    metadata: 'object (default: {})'
  },
  apiResponse: {
    nodes: 'array of node objects',
    links: 'array of link objects (for GET /api/chats/:id/nodes)'
  },
  apiRequest: {
    create: {
      chatId: 'string (required, valid ObjectId)',
      parentId: 'string (optional, valid ObjectId)',
      type: "'USER' | 'AI' (required)",
      content: 'string (required)',
      metadata: 'object (optional)'
    },
    update: {
      isFlagged: 'boolean (optional)',
      content: 'string (optional)',
      metadata: 'object (optional)'
    }
  }
};

module.exports = {
  PROJECT_SCHEMA,
  CHAT_SCHEMA,
  NODE_SCHEMA
};
