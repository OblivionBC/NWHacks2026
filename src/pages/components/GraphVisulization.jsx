import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

export default function TreeGraph(props) {
    const {data, onNodeClick, currentNodeId, collapseFlags} = props
    const svgRef = useRef();
    const previousCollapseFlagsRef = useRef(collapseFlags);
    const savedZoomTransformRef = useRef(d3.zoomIdentity);
    const width = 700;
    const height = 1000;
    const margin = { top: 30, right: 50, bottom: 30, left: 50 };

   const generateSVGGraph = useCallback((data, collapseFlags, shouldResetZoom) => {
    if (!data || !data.nodes) return;

    const svg = d3.select(svgRef.current);
    
    // Try to get current zoom transform from the SVG element before removing children
    let currentTransform = null;
    try {
        currentTransform = d3.zoomTransform(svg.node());
    } catch (e) {
        // Transform might not exist yet
    }
    
    // Save transform if it exists and we're not resetting
    if (currentTransform && !shouldResetZoom && currentTransform !== d3.zoomIdentity) {
        savedZoomTransformRef.current = currentTransform;
    }
    
    svg.selectAll("*").remove(); 
    svg.attr("viewBox", [0, 0, width, height]);

    const viewport = svg.append("g").attr("class", "zoom-viewport");

    // Add tooltip element
    const tooltip = d3.select("body").selectAll(".graph-tooltip").data([null]);
    const tooltipEnter = tooltip.enter().append("div")
      .attr("class", "graph-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.9)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("max-width", "300px")
      .style("word-wrap", "break-word")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("border", "1px solid rgba(111, 242, 214, 0.5)")
      .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.5)");
    
    const tooltipDiv = tooltipEnter.merge(tooltip);

    const zoomBehavior = d3.zoom()
        .scaleExtent([0.5, 5])
        .on("zoom", (event) => {
            savedZoomTransformRef.current = event.transform;
            viewport.attr("transform", event.transform);
        });

    svg.call(zoomBehavior);
    
    // Restore zoom transform or reset if collapseFlags changed
    if (shouldResetZoom) {
        svg.call(zoomBehavior.transform, d3.zoomIdentity);
        savedZoomTransformRef.current = d3.zoomIdentity;
    } else {
        // Restore the saved transform
        const transformToRestore = savedZoomTransformRef.current || d3.zoomIdentity;
        svg.call(zoomBehavior.transform, transformToRestore);
        viewport.attr("transform", transformToRestore);
    }

    // Build original hierarchy to identify leaf nodes
    const originalStratify = d3.stratify()
        .id(d => d.id)
        .parentId(d => d.parentId);
    
    const originalRoot = originalStratify(data.nodes);
    
    // Identify leaf nodes (nodes with no children)
    const leafNodeIds = new Set();
    originalRoot.each(d => {
        if (!d.children || d.children.length === 0) {
            leafNodeIds.add(d.id);
        }
    });

    // Filter nodes if collapseFlags is enabled
    let nodesToUse = data.nodes;
    if (collapseFlags) {
        // Keep: root nodes (parentId === null), flagged nodes, and leaf nodes
        const visibleNodeIds = new Set();
        
        // First pass: identify all nodes to keep
        data.nodes.forEach(node => {
            if (node.parentId === null || node.isFlagged || leafNodeIds.has(node.id)) {
                visibleNodeIds.add(node.id);
            }
        });

        // Second pass: reconstruct parent-child relationships
        // For each visible node, find its nearest visible ancestor
        const nodeMap = new Map(data.nodes.map(n => [n.id, n]));
        const filteredNodes = [];
        
        visibleNodeIds.forEach(nodeId => {
            const node = nodeMap.get(nodeId);
            if (!node) return;
            
            // Find nearest visible ancestor
            let current = node;
            let nearestVisibleParentId = null;
            
            while (current.parentId !== null) {
                if (visibleNodeIds.has(current.parentId)) {
                    nearestVisibleParentId = current.parentId;
                    break;
                }
                current = nodeMap.get(current.parentId);
                if (!current) break;
            }
            
            filteredNodes.push({
                ...node,
                parentId: nearestVisibleParentId
            });
        });
        
        nodesToUse = filteredNodes;
    }

    // --- STRATIFY THE DATA ---
    // d3.stratify converts flat arrays with 'id' and 'parentId' into a hierarchy
    const stratify = d3.stratify()
        .id(d => d.id)
        .parentId(d => d.parentId);

    const root = stratify(nodesToUse);

    const treeLayout = d3.tree()
        .size([
            width - margin.left - margin.right, 
            height - margin.top - margin.bottom
        ])
        .nodeSize([80, 100]); // Horizontal and vertical spacing between nodes
    
    treeLayout(root);

    const chartContainer = viewport.append("g")
        .attr("class", "chart-viewport")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Links
    chartContainer.append("g")
        .attr("stroke", "#ccc")
        .attr("fill", "none")
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("d", d3.linkVertical() 
            .x(d => d.x)
            .y(d => d.y));

    // Nodes
    const nodeSelection = chartContainer.append("g")
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            tooltipDiv
              .style("visibility", "visible")
              .html(`<strong>${d.data.type}:</strong><br/>${d.data.content}`);
        })
        .on("mousemove", function(event) {
            tooltipDiv
              .style("top", (event.pageY - 10) + "px")
              .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            tooltipDiv.style("visibility", "hidden");
        })
        .on("click", function(event, d) {
            // Remove previous selection highlights
            chartContainer.selectAll("circle").attr("stroke", "none").attr("stroke-width", 0);
            // Highlight clicked node
            d3.select(this).select("circle").attr("stroke", "#ff6b6b").attr("stroke-width", 2);
            console.log("Clicked node:", d.data);
            // Emit the node click event
            if(onNodeClick) {
                onNodeClick(d.data.id);
            }
        });

    nodeSelection.append("circle")
        .attr("fill", d => {
        if (d.data.id === currentNodeId) {
            return "#555"; // Dark Gray for the Active Node
        }
        if (d.data.isFlagged) {
            return "#000000"; // Orange/Gold for Flagged Nodes
        }
        return "#999"; // Light Gray for Regular Nodes
    })
    .attr("stroke", d => {
        // Current node styling trumps flagged styling
        if (d.data.id === currentNodeId) {
            return "#4682B4"; // Blue for current node
        }
        if (d.data.isFlagged) {
            return "#ffA500"; // Orange for flagged nodes
        }
        return "#4682B4"; // Default blue
    })
    .attr("stroke-width", d => 
        d.data.id === currentNodeId || d.data.isFlagged ? 2 : 0                             
    )
    .attr("r", d => {
        if (d.data.id === currentNodeId) {
            return 12;
        }
        if (d.data.parentId === null) {
            return 12;
        }
        if (d.data.isFlagged) {
            return 12;
        }
        return 6;
    })

     nodeSelection.append("text")
        .attr("dy", "0.35em") // Vertical center
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .text(d => d.data.isFlagged && d.data.id !== currentNodeId ? '🏳️': '');

    // --- FIX 2: CORRECT TEXT ACCESSOR ---
    // Add labels below nodes with background
    const labelGroup = nodeSelection.append("g")
        .attr("class", "node-label")
        .attr("transform", d => d.children ? "translate(0, -28)" : "translate(0, 22)");

    // Add background rectangle for label
    labelGroup.each(function(d) {
        const text = d.data.content || "";
        const truncatedText = text.length > 20 ? text.substring(0, 20) + "..." : text;
        const paddingH = 4; // Horizontal padding
        const paddingV = 3; // Vertical padding
        const charWidth = 5.5;
        const width = Math.max(truncatedText.length * charWidth + paddingH * 2, 30);
        const height = 16;
        
        d3.select(this).append("rect")
            .attr("x", -width / 2)
            .attr("y", -height / 2)
            .attr("width", width)
            .attr("height", height)
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("fill", d.data.type === 'USER' ? 'rgba(48, 131, 220, 0.9)' : 'rgba(111, 242, 214, 0.9)')
            .attr("stroke", d.data.type === 'USER' ? 'rgba(95, 164, 238, 0.8)' : 'rgba(111, 242, 214, 1)')
            .attr("stroke-width", 1.5);
    });

    // Add label text
    labelGroup.append("text")
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(0, 0, 0, 0.9)")
        .style("font-size", "10px")
        .style("font-weight", "600")
        .style("pointer-events", "none")
        .text(d => {
            const text = d.data.content || "";
            return text.length > 20 ? text.substring(0, 20) + "..." : text;
        });

}, [margin, width, height, onNodeClick, currentNodeId]);

   useEffect(() => {
    if(data?.nodes?.length > 0){
        const collapseFlagsChanged = previousCollapseFlagsRef.current !== collapseFlags;
        previousCollapseFlagsRef.current = collapseFlags;
        generateSVGGraph(data, collapseFlags, collapseFlagsChanged)
    }
   

}, [data, collapseFlags, generateSVGGraph]);

    return (
    <>
        <svg ref={svgRef} style={{ width: '100%', height: 'auto' }}></svg>
    </>
    )
}