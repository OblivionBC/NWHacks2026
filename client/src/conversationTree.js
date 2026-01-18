export class ConversationNode {
  constructor(message, role, parentId = null) {
    this.id = crypto.randomUUID();
    this.message = message;
    this.role = role;
    this.parentId = parentId;
    this.children = [];
    this.timestamp = new Date().toISOString();
  }
}

export class ConversationTree {
  constructor() {
    this.nodes = new Map();
    this.root = new ConversationNode('Start a new conversation', 'system', null);
    this.nodes.set(this.root.id, this.root);
    this.currentNodeId = this.root.id;
  }

  addMessage(message, role) {
    const newNode = new ConversationNode(message, role, this.currentNodeId);
    this.nodes.set(newNode.id, newNode);

    const parent = this.nodes.get(this.currentNodeId);
    if (parent) {
      parent.children.push(newNode.id);
    }

    this.currentNodeId = newNode.id;
    return newNode;
  }

  navigateToNode(nodeId) {
    if (this.nodes.has(nodeId)) {
      this.currentNodeId = nodeId;
      return true;
    }
    return false;
  }

  getPathToNode(nodeId) {
    const path = [];
    let currentId = nodeId;

    while (currentId !== null) {
      const node = this.nodes.get(currentId);
      if (!node) break;
      path.unshift(node);
      currentId = node.parentId;
    }

    return path;
  }

  getCurrentPath() {
    return this.getPathToNode(this.currentNodeId);
  }

  getMessagesForAPI() {
    const path = this.getCurrentPath();
    return path
      .filter(node => node.role !== 'system')
      .map(node => ({
        role: node.role,
        content: node.message,
      }));
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  serialize() {
    return {
      nodes: Array.from(this.nodes.entries()),
      currentNodeId: this.currentNodeId,
      rootId: this.root.id,
    };
  }

  static deserialize(data) {
    const tree = new ConversationTree();
    tree.nodes = new Map(data.nodes);
    tree.currentNodeId = data.currentNodeId;
    tree.root = tree.nodes.get(data.rootId);
    return tree;
  }
}
