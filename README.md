# Idea Chat - Branching Conversation App

A web application for brainstorming and exploring ideas using OpenAI's GPT-4, with support for branching conversations that let you explore different directions in your chat history.

## Features

- **AI-Powered Chat**: Powered by OpenAI GPT-4 for intelligent idea generation
- **Branching Conversations**: Navigate back to any point in the conversation and explore different directions
- **Tree Visualization**: Visual representation of your conversation branches
- **Interactive Navigation**: Click on nodes in the tree to jump to different points in the conversation

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- An OpenAI API key

### Installation

1. **Install server dependencies**:
```bash
cd server
npm install
```

2. **Install client dependencies**:
```bash
cd client
npm install
```

3. **Configure environment variables**:

Create a `.env` file in the `server` directory:
```bash
cd server
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_api_key_here
PORT=3001
```

### Running the Application

1. **Start the backend server** (from the `server` directory):
```bash
npm run dev
```

The server will start on http://localhost:3001

2. **Start the frontend** (from the `client` directory, in a new terminal):
```bash
npm run dev
```

The app will start on http://localhost:3000

3. **Open your browser** and navigate to http://localhost:3000

## How to Use

### Chat Tab
- Type your ideas or questions in the input field
- The AI will respond with suggestions and elaborations
- Continue the conversation naturally

### Tree View Tab
- See a visual representation of all your conversation branches
- Purple/blue nodes show your current conversation path
- Green numbers indicate how many branches exist from that point
- Click any node to jump to that point in the conversation
- Click branch buttons to explore different conversation paths

### Creating Branches
Whenever you navigate back to a previous point in the conversation (using the Tree View) and send a new message, you create a new branch. This allows you to:
- Explore different angles of the same idea
- Compare different approaches
- Backtrack when a conversation goes off-track

## Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT-4 API
- **Visualization**: HTML5 Canvas

## Project Structure

```
.
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── App.jsx        # Main app component with tab navigation
│   │   ├── ChatInterface.jsx    # Chat UI component
│   │   ├── TreeView.jsx         # Tree visualization component
│   │   └── conversationTree.js  # Tree data structure
│   └── package.json
├── server/                # Backend Express server
│   ├── server.js         # API endpoints and OpenAI integration
│   └── package.json
└── README.md
```

## API Endpoints

### POST /api/chat
Send messages to the AI and get responses.

**Request body**:
```json
{
  "messages": [
    { "role": "user", "content": "Your message" },
    { "role": "assistant", "content": "AI response" }
  ]
}
```

**Response**:
```json
{
  "message": "AI response text"
}
```

## Notes

- The conversation tree is stored in memory and will be lost on page refresh
- Each branch maintains its own conversation history
- The app uses GPT-4 by default (you can modify this in [server/server.js](server/server.js))
