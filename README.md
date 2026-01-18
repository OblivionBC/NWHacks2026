# ThoughtTree

**Git for AI workflows.** ThoughtTree transforms linear AI chats into branching idea trees, preserving context, allowing exploration, and enabling human-AI collaboration where ideas can grow and accumulate over time.

---

## Why ThoughtTree?

Current AI conversations are linear: once you go deep on one idea, others get lost, and context becomes polluted. ThoughtTree solves this by letting you branch at key decision points, so you can explore multiple ideas deeply without losing any context.

Imagine brainstorming solutions for climate change. You explore carbon capture, reforestation, and green transport. In a normal chat, diving into one idea buries the others. With ThoughtTree, you branch and return seamlessly, keeping all ideas fresh and available.

---

## Problem

- Linear AI chats cause **context loss** and **idea abandonment**.
- Users cannot **explore multiple paths deeply** without losing breadth.
- Visualizing thinking patterns is nearly impossible in traditional AI chats.

---

## Features

- Branching conversations: explore multiple ideas without losing context  
- Visual mapping: see how your ideas and branches relate  
- Return to any branch or previous state instantly  
- Compare and synthesize multiple exploration paths  

---

## Future Additions

- Collaborative branching: multiple users can merge and branch off each other’s work  
- Shared thought spaces for team AI brainstorming  
- Persistent memory and universal search  
- Exporting workflows and integrations with other tools  

---

## Tech Stack

- **Frontend:** React, JavaScript, CSS  
- **Backend:** Node.js with RESTful APIs  
- **Database:** MongoDB Atlas (stores conversations as a directed graph with parent-child relationships)  
- **Visualization:** D3.js for interactive tree structure  
- **AI Integration:** Google Gemini API for generating conversation responses  

---

## Data Model

### Projects
Top-level container for different workstreams.

```ts
type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};
```

### Chats
Represents a single session or branch within a project.

```ts
type Chat = {
  id: string;
  projectId: string;
  title: string;
  lastUpdated: string;
};
```

### Nodes
Individual AI/user messages stored as nodes in a directed graph.

```ts
type Node = {
  id: string;
  chatId: string;
  parentId: string | null;
  type: "USER" | "AI";
  content: string;
  isFlagged: boolean;
  timestamp: string;
  metadata?: {
    avatar?: string;
    model?: string;
  };
};
```

Nodes and links are returned from the API to feed D3 for visualization.

---

## Demo Workflow

1. Start a conversation and generate multiple promising ideas.  
2. Create a branch to explore one idea in depth.  
3. Generate detailed analysis, outlines, and pros/cons.  
4. Return to the original branch to explore other ideas seamlessly.  
5. Compare branches side-by-side and combine insights.  

---

## Contribution

- Frontend & design: UI, styling, React components, connecting the interface to the backend using JavaScript and CSS  
- Backend: API endpoints for projects, chats, and nodes  
- AI integration: Gemini API for generating conversation content  