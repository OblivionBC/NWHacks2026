import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

export default function TreeGraph(props) {
    const {data, onNodeClick, currentNodeId} = props
    const svgRef = useRef();
    const width = 700;
    const height = 1000;
    const margin = { top: 30, right: 50, bottom: 30, left: 50 };

   const generateSVGGraph = useCallback((data) => {
    if (!data || !data.nodes) return;

    const svg = d3.select(svgRef.current);
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
            viewport.attr("transform", event.transform);
        });

    svg.call(zoomBehavior);

    // --- FIX 1: STRATIFY THE DATA ---
    // d3.stratify converts flat arrays with 'id' and 'parentId' into a hierarchy
    const stratify = d3.stratify()
        .id(d => d.id)
        .parentId(d => d.parentId);

    const root = stratify(data.nodes);

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
    .attr("stroke", d =>  d.data.isFlagged  ? "#ffA500" : "lightblue")
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

}, [margin, width, height]);

   useEffect(() => {
    if(data?.nodes?.length > 0){
        generateSVGGraph(data)
    }
   

}, [data, generateSVGGraph]);

    return (
    <>
        <svg ref={svgRef} style={{ width: '100%', height: 'auto' }}></svg>
    </>
    )
}