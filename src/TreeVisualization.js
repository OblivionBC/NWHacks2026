import { useEffect, useRef, useState } from 'react';
import { api } from './api';

function TreeVisualization({ chatId, onNodeClick }) {
  const svgRef = useRef(null);
  const [treeData, setTreeData] = useState({ nodes: [], links: [] });
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    if (chatId) {
      loadTreeData();
    }
  }, [chatId]);

  useEffect(() => {
    if (treeData.nodes.length > 0) {
      renderTree();
    }
  }, [treeData, selectedNodeId]);

  const loadTreeData = async () => {
    try {
      const data = await api.getChatNodes(chatId);
      setTreeData(data);
    } catch (err) {
      console.error('Failed to load tree data:', err);
    }
  };

  const renderTree = () => {
    const svg = svgRef.current;
    if (!svg) return;

    // Clear existing content
    svg.innerHTML = '';

    const { nodes, links } = treeData;
    if (nodes.length === 0) return;

    // SVG dimensions
    const width = svg.clientWidth || 800;
    const height = Math.max(nodes.length * 80, 400);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Build tree structure
    const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [] }]));
    const roots = [];

    nodes.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId).children.push(nodeMap.get(node.id));
      } else {
        roots.push(nodeMap.get(node.id));
      }
    });

    // Layout algorithm - simple tree layout
    const levelHeight = 100;
    const nodeSpacing = 60;

    const layout = (node, depth = 0, offset = 0) => {
      node.x = depth * 200 + 50;
      node.y = offset * levelHeight + 50;

      let childOffset = offset;
      node.children.forEach(child => {
        childOffset = layout(child, depth + 1, childOffset);
      });

      return node.children.length > 0 ? childOffset : offset + 1;
    };

    let currentOffset = 0;
    roots.forEach(root => {
      currentOffset = layout(root, 0, currentOffset);
    });

    // Draw links
    const linkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    linkGroup.setAttribute('class', 'tree-links');

    links.forEach(link => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);

      if (source && target) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${source.x + 25} ${source.y + 25} C ${source.x + 100} ${source.y + 25}, ${target.x - 75} ${target.y + 25}, ${target.x - 25} ${target.y + 25}`;
        path.setAttribute('d', d);
        path.setAttribute('class', 'tree-link');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#6ff2d6');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('opacity', '0.4');
        linkGroup.appendChild(path);
      }
    });

    svg.appendChild(linkGroup);

    // Draw nodes
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeGroup.setAttribute('class', 'tree-nodes');

    nodes.forEach(node => {
      const nodeData = nodeMap.get(node.id);
      const isSelected = node.id === selectedNodeId;

      // Node circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', nodeData.x);
      circle.setAttribute('cy', nodeData.y);
      circle.setAttribute('r', isSelected ? '30' : '25');
      circle.setAttribute('class', `tree-node ${node.type.toLowerCase()} ${isSelected ? 'selected' : ''}`);
      circle.setAttribute('fill', node.type === 'USER' ? '#7c6bff' : '#6ff2d6');
      circle.setAttribute('stroke', isSelected ? '#ffffff' : 'none');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('opacity', '0.8');
      circle.style.cursor = 'pointer';

      circle.addEventListener('click', () => {
        setSelectedNodeId(node.id);
        if (onNodeClick) {
          onNodeClick(node.id);
        }
      });

      // Hover effect
      circle.addEventListener('mouseenter', () => {
        circle.setAttribute('opacity', '1');
        circle.setAttribute('r', '28');
      });

      circle.addEventListener('mouseleave', () => {
        circle.setAttribute('opacity', '0.8');
        circle.setAttribute('r', isSelected ? '30' : '25');
      });

      nodeGroup.appendChild(circle);

      // Node label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', nodeData.x);
      text.setAttribute('y', nodeData.y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('class', 'tree-node-label');
      text.setAttribute('fill', '#ffffff');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', 'bold');
      text.textContent = node.type === 'USER' ? 'U' : 'AI';
      text.style.pointerEvents = 'none';
      nodeGroup.appendChild(text);

      // Branch count indicator
      if (nodeData.children.length > 1) {
        const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        badge.setAttribute('cx', nodeData.x + 18);
        badge.setAttribute('cy', nodeData.y - 18);
        badge.setAttribute('r', '10');
        badge.setAttribute('fill', '#ffb347');
        badge.setAttribute('stroke', '#1a1a2e');
        badge.setAttribute('stroke-width', '2');
        nodeGroup.appendChild(badge);

        const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        badgeText.setAttribute('x', nodeData.x + 18);
        badgeText.setAttribute('y', nodeData.y - 14);
        badgeText.setAttribute('text-anchor', 'middle');
        badgeText.setAttribute('fill', '#1a1a2e');
        badgeText.setAttribute('font-size', '10');
        badgeText.setAttribute('font-weight', 'bold');
        badgeText.textContent = nodeData.children.length;
        badgeText.style.pointerEvents = 'none';
        nodeGroup.appendChild(badgeText);
      }
    });

    svg.appendChild(nodeGroup);
  };

  return (
    <div className="tree-visualization">
      {treeData.nodes.length === 0 ? (
        <div className="tree-empty">
          <p className="muted">No conversation history yet. Start chatting to see the tree!</p>
        </div>
      ) : (
        <svg ref={svgRef} className="tree-svg" />
      )}
    </div>
  );
}

export default TreeVisualization;
