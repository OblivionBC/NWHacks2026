# ThoughtTree Setup Guide

A branching AI chat application for idea generation and brainstorming, built with React, Express, MongoDB, and OpenAI.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **OpenAI API Key** - [Get your key](https://platform.openai.com/api-keys)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
npm install openai
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

```env
MONGODB_URI=mongodb://localhost:27017
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
PORT=3001
```

**Important:** Replace `sk-your-actual-openai-api-key-here` with your real OpenAI API key.

### 3. Start MongoDB

Make sure MongoDB is running on your system:

**Windows:**
```bash
# MongoDB should be running as a service
# Or start manually:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 4. Run the Application

Start both the backend and frontend servers:

```bash
npm run dev
```

This will start:
- React frontend at **http://localhost:3000**
- Express backend at **http://localhost:3001**

Alternatively, you can run them separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm start
```

## Features

### 1. Project Management
- Create new projects with "Create a new project" button
- Each project represents a separate workspace
- View all projects in the Projects tab
- Projects are automatically saved to MongoDB

### 2. AI Chat Interface
- Send messages and get AI responses powered by GPT-4o-mini
- Messages are displayed in a beautiful chat interface
- Conversation history is maintained across sessions

### 3. Branching Conversations
- Create multiple conversation paths from any message
- When multiple branches exist, a branch selector appears
- Click on different branches to explore alternative conversation paths
- Each branch maintains its own conversation history

### 4. Tree Visualization
- Switch to "View history" tab to see your conversation tree
- Nodes are color-coded:
  - Purple (Violet) = User messages
  - Teal (Mint) = AI responses
- Orange badges show nodes with multiple branches
- Click on any node to navigate to that point in the conversation

## How to Use

### Starting a New Conversation

1. Click **"Start a new project"** on the home page or **"Create a new project"** in the sidebar
2. A new project is created and the chat interface opens
3. Type your message in the input box and click **"Send"**
4. The AI will respond, and both messages are saved to the tree

### Creating Branches

To create a branch from any previous message:

1. When you see multiple branch options highlighted in amber/orange
2. Click on a branch to switch to that conversation path
3. Send a new message from that point to create a new branch
4. All branches are preserved and can be revisited

### Viewing the Tree

1. Click **"View history"** in the sidebar while in a project
2. See the full conversation tree with all branches
3. Nodes with multiple children show an orange badge with the count
4. Click on any node to explore that branch (feature can be extended)

## Architecture

### Frontend (React)
- `App.js` - Main application component with routing and state management
- `ChatInterface.js` - Chat UI with message display and branching logic
- `TreeVisualization.js` - SVG-based tree rendering
- `api.js` - API client for backend communication
- `App.css` - All styling with beautiful dark theme and glassmorphism

### Backend (Express + MongoDB)
- `src/db/server.js` - Express server setup and routes
- `src/db/db.js` - MongoDB connection
- `src/db/db-routes.js` - API route handlers and OpenAI integration

### Database Schema

**Projects Collection:**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  createdAt: ISO String,
  userId: String
}
```

**Chats Collection:**
```javascript
{
  _id: ObjectId,
  projectId: String,
  title: String,
  lastUpdated: ISO String
}
```

**Nodes Collection:**
```javascript
{
  _id: ObjectId,
  chatId: String,
  parentId: ObjectId | null,  // null for root nodes
  type: 'USER' | 'AI',
  content: String,
  isFlagged: Boolean,
  timestamp: ISO String,
  metadata: Object
}
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project

### Chats
- `GET /api/projects/:id/chats` - Get chats for a project
- `POST /api/chats` - Create a new chat session

### Nodes
- `GET /api/chats/:id/nodes` - Get all nodes in D3 tree format
- `POST /api/nodes` - Create a single node
- `PATCH /api/nodes/:id` - Update a node

### AI Chat
- `POST /api/chat/completion` - Send message and get AI response
  - Creates both user and AI nodes
  - Builds conversation history from parent chain
  - Returns both nodes in response

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongo` or `mongosh` should connect
- Check your `MONGODB_URI` in `.env`
- Default connection: `mongodb://localhost:27017`

### OpenAI API Errors
- Verify your API key in `.env`
- Check your OpenAI account has credits: https://platform.openai.com/account/usage
- The app uses `gpt-4o-mini` model (cost-effective)

### Port Already in Use
- Change the `PORT` in `.env` to a different number
- Or kill the process using port 3001:
  ```bash
  # Windows
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F

  # Mac/Linux
  lsof -ti:3001 | xargs kill
  ```

### Frontend Can't Connect to Backend
- Ensure backend is running on port 3001
- Check `src/api.js` has correct `API_BASE` URL
- Verify CORS is enabled in `src/db/server.js`

## Development Tips

### Code Organization
- Keep chat logic in `ChatInterface.js`
- Keep tree visualization in `TreeVisualization.js`
- API calls centralized in `api.js`
- All styling in `App.css` (no CSS-in-JS)

### Styling Guidelines
- Use CSS variables from `:root` for colors
- Follow existing glassmorphism aesthetic
- Color palette: violet, mint, amber, pink
- Consistent spacing: 8px, 12px, 16px, 24px

### Adding New Features
1. Update backend routes in `db-routes.js`
2. Add route to `server.js`
3. Update `api.js` with new endpoint
4. Create/update React components
5. Add styling to `App.css`

## Next Steps

Potential enhancements:
- Add user authentication
- Implement node flagging/bookmarking
- Add export functionality (PDF, markdown)
- Improve tree layout algorithm
- Add search across conversations
- Implement collaborative projects
- Add voice input/output
- Support for images and files

## Credits

Built for nwHacks 2026 by the ThoughtTree team.

Powered by:
- React 19
- OpenAI GPT-4o-mini
- MongoDB
- Express.js
