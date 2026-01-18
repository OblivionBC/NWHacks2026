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

    const treeLayout = d3.tree().size([
        width - margin.left - margin.right, 
        height - margin.top - margin.bottom
    ]);
    
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
        .style("cursor", (d) => {
        // 'd.data' is your original node object
        // Example: only show pointer for "AI" type nodes
        return d.data.type === "AI" ? "pointer" : "default";
        })
        .on("click", function(event, d) {
            if(d.data.type === "AI"){
                // Remove previous selection highlights
                chartContainer.selectAll("circle").attr("stroke", "none").attr("stroke-width", 0);
                // Highlight clicked node
                d3.select(this).select("circle").attr("stroke", "#ff6b6b").attr("stroke-width", 2);
                console.log("Clicked node:", d.data);
                // Emit the node click event
                if(onNodeClick) {
                    onNodeClick(d.data.id);
                }
            }
        });

    nodeSelection.append("circle")
        .attr("fill", d => d.id === currentNodeId ? "#555" : "#999")
        .attr("stroke", d =>  d.data.isFlagged  ? "#ffA500" : "#FFFF00")
        .attr("stroke-width", d => 
            d.data.id === currentNodeId || d.data.isFlagged ? 1 : 0                             
        )
        .attr("r", d => d.data.isFlagged ? 12 : 6)

     nodeSelection.append("text")
        .attr("dy", "0.35em") // Vertical center
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .text(d => d.data.isFlagged ? '🏳️': '');

    // --- FIX 2: CORRECT TEXT ACCESSOR ---
    nodeSelection.append("text")
        .attr("dy", "0.31em")
        .attr("y", d => d.children ? -15 : 15) 
        .attr("text-anchor", "middle")
        .text(d => d.data.content) // d.data is the original node object
        .attr("fill", d => d.id === currentNodeId ? "yellow" : "white")
        .style("font-size", "10px")
        // Optional: Simple text truncation for long content
        .each(function(d) {
            const self = d3.select(this);
            const text = d.data.content || "";
            if (text.length > 20) {
                self.text(text.substring(0, 20) + "...");
            }
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