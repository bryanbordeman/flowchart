import React, { useRef } from "react";
import FlowchartNode from "./FlowchartNode";
import Connection from "./Connection";
import apLogo from "../assets/ap_logo.svg";

const Canvas = ({
    nodes,
    connections,
    selectedNode,
    isConnecting,
    connectingFrom,
    segments,
    onSelectNode,
    onUpdateNodePosition,
    onUpdateNodeText,
    onUpdateNode,
    onDeleteNode,
    onAddNode,
    onStartConnection,
    onCompleteConnection,
    onCancelConnection,
    onDeleteConnection,
}) => {
    const canvasRef = useRef(null);

    // Deselect node when clicking on canvas (not on a node)
    const handleCanvasClick = (e) => {
        // Only deselect if the click is directly on the canvas (not a child)
        if (e.target === canvasRef.current) {
            onSelectNode(null);
            if (isConnecting) {
                onCancelConnection();
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const nodeType = e.dataTransfer.getData("nodeType");

        if (nodeType) {
            const rect = canvasRef.current.getBoundingClientRect();
            const rawX = e.clientX - rect.left - 60; // Offset to center the 120px wide node
            const rawY = e.clientY - rect.top - 40; // Offset to center the 80px tall node

            // Snap to grid (20px)
            const gridSize = 20;
            let snappedX = Math.round(rawX / gridSize) * gridSize;
            let snappedY = Math.round(rawY / gridSize) * gridSize;

            const position = { x: snappedX, y: snappedY };

            onAddNode(nodeType, position);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    // Deselect node when clicking anywhere in canvas-container (outside nodes)
    const handleContainerClick = (e) => {
        // Only deselect if the click is NOT inside a node
        if (
            !e.target.classList.contains("flowchart-node") &&
            !e.target.closest(".flowchart-node")
        ) {
            onSelectNode(null);
            if (isConnecting) {
                onCancelConnection();
            }
        }
    };

    // Calculate dynamic canvas size based on node positions
    const margin = 600; // Extra space around nodes for scrolling (increased for more expansion)
    let minX = 0,
        minY = 0,
        maxX = 1200,
        maxY = 800; // Defaults
    if (nodes.length > 0) {
        minX = Math.min(...nodes.map((n) => n.position.x));
        minY = Math.min(...nodes.map((n) => n.position.y));
        maxX = Math.max(...nodes.map((n) => n.position.x + 120));
        maxY = Math.max(
            ...nodes.map(
                (n) => n.position.y + (n.type === "decision" ? 120 : 80)
            )
        );
        // Add margin for scrolling, but do not allow canvas to expand left/up past origin
        minX = Math.max(0, minX - margin);
        minY = Math.max(0, minY - margin);
        maxX = maxX + margin;
        maxY = maxY + margin;
    }

    const canvasStyle = {
        position: "relative",
        width: maxX - minX,
        height: maxY - minY,
        minWidth: "100vw",
        minHeight: "100vh",
        left: minX < 0 ? -minX : 0,
        top: minY < 0 ? -minY : 0,
        background: "inherit",
    };

    return (
        <div
            className="canvas-container"
            onClick={handleContainerClick}
            style={{ overflow: "auto", width: "100%", height: "100%" }}
        >
            <div
                ref={canvasRef}
                className="canvas"
                style={canvasStyle}
                onClick={handleCanvasClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {/* SVG overlay for connections */}
                <svg
                    className="connections-layer"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "auto",
                        zIndex: 5,
                    }}
                >
                    {/* Arrow marker definition */}
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="8"
                            markerHeight="6"
                            refX="7"
                            refY="3"
                            orient="auto"
                        >
                            <polygon points="0 0, 8 3, 0 6" fill="#4682B4" />
                        </marker>
                    </defs>

                    {connections.map((connection) => (
                        <Connection
                            key={connection.id}
                            connection={connection}
                            nodes={nodes}
                            onDelete={onDeleteConnection}
                        />
                    ))}
                </svg>

                {nodes.map((node) => (
                    <FlowchartNode
                        key={node.id}
                        node={node}
                        segments={segments}
                        isSelected={selectedNode === node.id}
                        isConnecting={isConnecting}
                        isConnectingFrom={
                            connectingFrom && connectingFrom.nodeId === node.id
                        }
                        onSelect={onSelectNode}
                        onUpdatePosition={onUpdateNodePosition}
                        onUpdateText={onUpdateNodeText}
                        onUpdateNode={onUpdateNode}
                        onDelete={onDeleteNode}
                        onStartConnection={onStartConnection}
                        onCompleteConnection={onCompleteConnection}
                    />
                ))}

                {/* SVG overlay for decision labels - rendered above nodes */}
                <svg
                    className="decision-labels-layer"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        zIndex: 100,
                    }}
                >
                    {connections
                        .filter((connection) => {
                            const fromNode = nodes.find(
                                (n) => n.id === connection.from
                            );
                            return (
                                fromNode &&
                                fromNode.type === "decision" &&
                                connection.decisionType
                            );
                        })
                        .map((connection) => {
                            const fromNode = nodes.find(
                                (n) => n.id === connection.from
                            );
                            const toNode = nodes.find(
                                (n) => n.id === connection.to
                            );
                            if (!fromNode || !toNode) return null;

                            // Calculate positions (copied from Connection component logic)
                            const getPortPosition = (node, port) => {
                                const nodeX = node.position.x;
                                const nodeY = node.position.y;

                                if (node.type === "decision") {
                                    // Decision is a 120x120 container with centered diamond
                                    const centerX = nodeX + 60; // Center of 120px diamond container
                                    const centerY = nodeY + 60;

                                    switch (port) {
                                        case "top":
                                            return { x: centerX, y: nodeY };
                                        case "right":
                                            return {
                                                x: nodeX + 120,
                                                y: centerY,
                                            };
                                        case "bottom":
                                            return {
                                                x: centerX,
                                                y: nodeY + 120,
                                            };
                                        case "left":
                                            return { x: nodeX, y: centerY };
                                        default:
                                            return { x: centerX, y: centerY };
                                    }
                                }

                                // Standard nodes (process, start, end, data) - 120x80
                                const centerX = nodeX + 60; // Center of 120px width
                                const centerY = nodeY + 40; // Center of 80px height

                                switch (port) {
                                    case "top":
                                        return { x: centerX, y: nodeY };
                                    case "right":
                                        return { x: nodeX + 120, y: centerY };
                                    case "bottom":
                                        return { x: centerX, y: nodeY + 80 };
                                    case "left":
                                        return { x: nodeX, y: centerY };
                                    default:
                                        return { x: centerX, y: centerY };
                                }
                            };

                            const startPoint = getPortPosition(
                                fromNode,
                                connection.fromPort
                            );
                            const endPoint = getPortPosition(
                                toNode,
                                connection.toPort
                            );
                            const dx = endPoint.x - startPoint.x;
                            const dy = endPoint.y - startPoint.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            if (distance === 0) return null;

                            const labelOffset = 35;
                            const labelPoint = {
                                x: startPoint.x + (dx * labelOffset) / distance,
                                y: startPoint.y + (dy * labelOffset) / distance,
                            };

                            const decisionLabel =
                                connection.decisionType === "yes"
                                    ? "Yes"
                                    : "No";

                            return (
                                <g key={`label-${connection.id}`}>
                                    <rect
                                        x={labelPoint.x - 16}
                                        y={labelPoint.y - 10}
                                        width="32"
                                        height="20"
                                        fill="white"
                                        stroke="#4682B4"
                                        strokeWidth="1"
                                        rx="10"
                                        ry="10"
                                    />
                                    <text
                                        x={labelPoint.x}
                                        y={labelPoint.y + 4}
                                        textAnchor="middle"
                                        fill="#4682B4"
                                        fontSize="12"
                                        fontWeight="bold"
                                        className="decision-label"
                                    >
                                        {decisionLabel}
                                    </text>
                                </g>
                            );
                        })}
                </svg>

                {/* Watermark logo */}
                <div
                    style={{
                        position: "absolute",
                        top: "20px",
                        left: "20px",
                        opacity: 0.1,
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                >
                    <img
                        src={apLogo}
                        alt="AP Logo Watermark"
                        style={{
                            width: "200px",
                            height: "auto",
                        }}
                    />
                </div>

                {nodes.length === 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            textAlign: "center",
                            color: "#999",
                            fontSize: "18px",
                            pointerEvents: "none",
                        }}
                    >
                        <div>
                            📊 Drag components from the sidebar to create your
                            flowchart
                        </div>
                        <div style={{ fontSize: "14px", marginTop: "10px" }}>
                            • Drag flowchart symbols from sidebar to canvas
                            <br />
                            • Drag from connection ports to create arrows
                            <br />• Hover over connections to delete them
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Canvas;
