import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

export default function TreeGraph(props) {
    const {data} = props
    const svgRef = useRef();
    const width = 600;
    const height = 400;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

   const generateSVGGraph = useCallback((data) => {
    if (!data || !data.nodes) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 
    svg.attr("viewBox", [0, 0, width, height]);

    const viewport = svg.append("g").attr("class", "zoom-viewport");

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
        .attr("transform", d => `translate(${d.x},${d.y})`);

    nodeSelection.append("circle")
        .attr("fill", d => d.children ? "#555" : "#999") 
        .attr("r", 6);

    // --- FIX 2: CORRECT TEXT ACCESSOR ---
    nodeSelection.append("text")
        .attr("dy", "0.31em")
        .attr("y", d => d.children ? -15 : 15) 
        .attr("text-anchor", "middle")
        .text(d => d.data.content) // d.data is the original node object
        .attr("fill", "white")
        .style("font-size", "10px")
        // Optional: Simple text truncation for long content
        .each(function(d) {
            const self = d3.select(this);
            const text = d.data.content || "";
            if (text.length > 20) {
                self.text(text.substring(0, 20) + "...");
            }
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