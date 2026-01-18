import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './TreeView.css';

const generateLabel = (message) => {
  // Topic patterns - matches common conversation starters
  const patterns = [
    { regex: /(?:here(?:'s| are)?\s+(?:some|a few)?)\s+(.+?)(?:\s+(?:for|to|that|you))/i, type: 'list' },
    { regex: /(?:let(?:'s| me| us))\s+(.+?)(?:\s+(?:the|your|this))/i, type: 'action' },
    { regex: /(?:you (?:can|could|should|might))\s+(.+?)(?:\s+(?:by|with|using|to))/i, type: 'suggestion' },
    { regex: /(?:(?:i|we) (?:can|could|will|would))\s+(.+?)(?:\s+(?:by|with|the))/i, type: 'offer' },
    { regex: /(?:how (?:about|to))\s+(.+?)(?:\?|\.|\s+(?:for|with))/i, type: 'how-to' },
    { regex: /(?:what (?:is|are|about))\s+(.+?)(?:\?|\.|\s+(?:is|are))/i, type: 'what' },
    { regex: /(?:why (?:not|don't|is))\s+(.+?)(?:\?|\.)/i, type: 'why' },
    { regex: /(?:consider|try|explore)\s+(.+?)(?:\s+(?:for|to|with))/i, type: 'idea' },
  ];

  // Try to match patterns
  for (const pattern of patterns) {
    const match = message.match(pattern.regex);
    if (match && match[1]) {
      let extracted = match[1].trim();
      // Clean up and capitalize
      extracted = extracted.replace(/^(a|an|the)\s+/i, '');
      extracted = extracted.charAt(0).toUpperCase() + extracted.slice(1);
      return extracted.slice(0, 25);
    }
  }

  // Look for key phrases that indicate topics
  const topicIndicators = [
    /(?:focus on|talking about|discussing|regarding)\s+(.+?)(?:\.|,|$)/i,
    /(?:idea(?:s)? (?:of|for|about))\s+(.+?)(?:\.|,|$)/i,
    /(?:approach(?:es)? (?:to|for))\s+(.+?)(?:\.|,|$)/i,
  ];

  for (const indicator of topicIndicators) {
    const match = message.match(indicator);
    if (match && match[1]) {
      let topic = match[1].trim();
      topic = topic.charAt(0).toUpperCase() + topic.slice(1);
      return topic.slice(0, 25);
    }
  }

  // Extract nouns and key concepts using simple heuristics
  const sentences = message.split(/[.!?]/);
  const firstSentence = sentences[0] || message;

  // Remove common filler words
  const stopWords = new Set([
    'about', 'would', 'could', 'should', 'there', 'their', 'these', 'those',
    'this', 'that', 'with', 'from', 'have', 'been', 'will', 'what', 'when',
    'where', 'which', 'while', 'whom', 'such', 'both', 'each', 'other',
    'some', 'any', 'all', 'many', 'more', 'most', 'very', 'also', 'just'
  ]);

  const words = firstSentence
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(w => w.replace(/[^a-z0-9]/gi, ''))
    .filter(word => word.length > 3 && !stopWords.has(word.toLowerCase()));

  // Look for capitalized words (proper nouns)
  const capitalizedWords = words.filter(word => /^[A-Z]/.test(word));

  if (capitalizedWords.length > 0) {
    const title = capitalizedWords.slice(0, 3).join(' ');
    return title.slice(0, 25);
  }

  // Use the most meaningful words
  if (words.length >= 2) {
    const title = words.slice(0, 3).join(' ');
    const capitalized = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
    return capitalized.slice(0, 25);
  }

  // Fallback to first few words
  const fallback = firstSentence.split(/\s+/).slice(0, 3).join(' ');
  return (fallback.charAt(0).toUpperCase() + fallback.slice(1)).slice(0, 25) || 'Response';
};

export default function TreeView({ tree, onNodeClick }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    if (!container || !svg) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', 'translate(50, 60)');

    const treeLayout = d3.tree()
      .size([width - 100, height - 120])
      .nodeSize([140, 100]);

    const convertToD3Hierarchy = () => {
      const buildNode = (nodeId) => {
        const node = tree.nodes.get(nodeId);
        if (!node) return null;

        const children = node.children
          .map(buildNode)
          .filter(n => n !== null);

        if (node.role === 'assistant' || node.role === 'system') {
          return {
            id: node.id,
            data: node,
            children: children,
          };
        } else {
          if (children.length === 1) {
            return children[0];
          } else if (children.length > 1) {
            return {
              id: node.id,
              data: node,
              children: children,
            };
          }
          return null;
        }
      };

      return buildNode(tree.root.id);
    };

    const rootData = convertToD3Hierarchy();
    if (!rootData) return;

    const root = d3.hierarchy(rootData);
    treeLayout(root);

    const currentPath = new Set(tree.getCurrentPath().map(n => n.id));

    // Draw curved links with smooth transitions
    const link = g
      .selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d => {
        const sourceX = d.source.x;
        const sourceY = d.source.y + 35;
        const targetX = d.target.x;
        const targetY = d.target.y - 35;

        return `M ${sourceX},${sourceY}
                C ${sourceX},${(sourceY + targetY) / 2}
                  ${targetX},${(sourceY + targetY) / 2}
                  ${targetX},${targetY}`;
      })
      .attr('fill', 'none')
      .attr('stroke', d => {
        const sourceInPath = currentPath.has(d.source.data.id);
        const targetInPath = currentPath.has(d.target.data.id);
        return sourceInPath && targetInPath ? '#5FA4EE' : '#e0e0e0';
      })
      .attr('stroke-width', d => {
        const sourceInPath = currentPath.has(d.source.data.id);
        const targetInPath = currentPath.has(d.target.data.id);
        return sourceInPath && targetInPath ? 3 : 2;
      })
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .attr('opacity', 1);

    const node = g
      .selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d.data.id);
      });

    // Draw rounded rectangle backgrounds for nodes
    node
      .append('rect')
      .attr('x', -60)
      .attr('y', -30)
      .attr('width', 120)
      .attr('height', 60)
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('fill', d => {
        const isCurrent = d.data.id === tree.currentNodeId;
        const isInPath = currentPath.has(d.data.id);

        if (isCurrent) return '#5FA4EE';
        if (isInPath) return '#b3d9ff';
        return '#FFFFFF';
      })
      .attr('stroke', d => {
        const isCurrent = d.data.id === tree.currentNodeId;
        const isInPath = currentPath.has(d.data.id);

        if (isCurrent) return '#3d8ed9';
        if (isInPath) return '#5FA4EE';
        return '#d0d0d0';
      })
      .attr('stroke-width', d => d.data.id === tree.currentNodeId ? 3 : 2)
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .attr('opacity', 1);

    // Add emoji/icon for AI
    node
      .filter(d => d.data.data.role === 'assistant')
      .append('text')
      .attr('dy', -12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px')
      .text('🤖')
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .delay(200)
      .attr('opacity', 1);

    // Add main label text
    node
      .filter(d => d.data.data.role === 'assistant')
      .append('text')
      .attr('dy', 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', d => {
        const isCurrent = d.data.id === tree.currentNodeId;
        const isInPath = currentPath.has(d.data.id);
        return (isCurrent || isInPath) ? '#FFFFFF' : '#333333';
      })
      .each(function(d) {
        const text = d3.select(this);
        const label = generateLabel(d.data.data.message);
        const words = label.split(/\s+/);

        if (words.length <= 2) {
          text.text(label);
        } else {
          const line1 = words.slice(0, 2).join(' ');
          const line2 = words.slice(2).join(' ');

          text.append('tspan')
            .attr('x', 0)
            .attr('dy', 0)
            .text(line1);

          if (line2) {
            text.append('tspan')
              .attr('x', 0)
              .attr('dy', 12)
              .text(line2);
          }
        }
      })
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .delay(300)
      .attr('opacity', 1);

    // Add branch count badge
    node
      .filter(d => d.data.data.children && d.data.data.children.length > 1)
      .append('circle')
      .attr('cx', 50)
      .attr('cy', -25)
      .attr('r', 12)
      .attr('fill', '#10b981')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .delay(400)
      .attr('opacity', 1);

    node
      .filter(d => d.data.data.children && d.data.data.children.length > 1)
      .append('text')
      .attr('x', 50)
      .attr('y', -21)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .text(d => d.data.data.children.length)
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .delay(400)
      .attr('opacity', 1);

    // Hover effects
    node
      .on('mouseenter', function(event, d) {
        d3.select(this).select('rect')
          .transition()
          .duration(200)
          .attr('transform', 'scale(1.05)')
          .attr('stroke-width', 3);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).select('rect')
          .transition()
          .duration(200)
          .attr('transform', 'scale(1)')
          .attr('stroke-width', d.data.id === tree.currentNodeId ? 3 : 2);
      });

    // Tooltip
    node
      .append('title')
      .text(d => {
        const msg = d.data.data.message;
        return msg.length > 150 ? msg.substring(0, 150) + '...' : msg;
      });

    // Zoom and pan
    const zoom = d3.zoom()
      .scaleExtent([0.3, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Center the view on initial load
    const bounds = g.node().getBBox();
    const initialScale = Math.min(width / bounds.width, height / bounds.height, 1) * 0.9;
    const initialX = (width - bounds.width * initialScale) / 2 - bounds.x * initialScale;
    const initialY = 50;

    svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

  }, [tree, onNodeClick]);

  const currentNode = tree.nodes.get(tree.currentNodeId);
  const pathNodes = tree.getCurrentPath();

  return (
    <div className="tree-view">
      <div className="tree-header">
        <h2>💡 Idea Map</h2>
        <p>Click any box to explore that idea • Scroll to zoom • Drag to move around</p>
      </div>

      <div className="tree-canvas-container" ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>

      <div className="tree-info">
        <div className="current-branch">
          <h3>📍 Current Path</h3>
          <div className="path-length">
            {pathNodes.filter(n => n.role !== 'system').length} messages in this conversation
          </div>
        </div>

        {currentNode && currentNode.children.length > 0 && (
          <div className="branches-info">
            <h3>🔀 Try These Ideas Next</h3>
            <div className="branch-list">
              {currentNode.children.map(childId => {
                const child = tree.nodes.get(childId);
                return (
                  <button
                    key={childId}
                    className="branch-button"
                    onClick={() => onNodeClick(childId)}
                  >
                    <span className="branch-icon">💬</span>
                    <span className="branch-preview">
                      {child.message.slice(0, 60)}
                      {child.message.length > 60 ? '...' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
