import React, { useRef, useState } from "react";
import FlowchartNode from "./FlowchartNode";
import Connection from "./Connection";
import Container from "./Container";
import apLogo from "../assets/ap_logo.svg";

const Canvas = ({
    nodes,
    connections,
    selectedNode,
    selectedNodes,
    selectedContainers,
    isConnecting,
    connectingFrom,
    segments,
    containers,
    selectedContainer,
    isDrawingContainer,
    onSelectNode,
    onToggleNodeSelection,
    onToggleContainerSelection,
    onClearAllSelections,
    onUpdateNodePosition,
    onHandleGroupMovement,
    onUpdateNodeText,
    onUpdateNode,
    onDeleteNode,
    onAddNode,
    onStartConnection,
    onCompleteConnection,
    onCancelConnection,
    onDeleteConnection,
    onAddContainer,
    onUpdateContainer,
    onDeleteContainer,
    onSelectContainer,
    onStartDrawingContainer,
    onStopDrawingContainer,
    zoom,
    onZoomWheel,
}) => {
    // Ref for the canvas DOM element
    const canvasRef = useRef(null);

    // Container drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingStart, setDrawingStart] = useState(null);
    const [currentDrawing, setCurrentDrawing] = useState(null);

    // Fallback for missing onZoomWheel
    const handleWheel = onZoomWheel || (() => {});

    // Handle mouse down for container drawing
    const handleMouseDown = (e) => {
        if (e.target === canvasRef.current && isDrawingContainer) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / zoom;
            const y = (e.clientY - rect.top) / zoom;

            setIsDrawing(true);
            setDrawingStart({ x, y });
            setCurrentDrawing({
                x,
                y,
                width: 0,
                height: 0,
            });
        }
    };

    // Handle mouse move for container drawing
    const handleMouseMove = (e) => {
        if (isDrawing && drawingStart && isDrawingContainer) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / zoom;
            const y = (e.clientY - rect.top) / zoom;

            const width = Math.abs(x - drawingStart.x);
            const height = Math.abs(y - drawingStart.y);
            const startX = Math.min(x, drawingStart.x);
            const startY = Math.min(y, drawingStart.y);

            setCurrentDrawing({
                x: startX,
                y: startY,
                width,
                height,
            });
        }
    };

    // Handle mouse up for container drawing
    const handleMouseUp = (e) => {
        if (isDrawing && currentDrawing && isDrawingContainer) {
            // Only create container if it has minimum size
            if (currentDrawing.width > 50 && currentDrawing.height > 30) {
                onAddContainer({
                    id: Date.now().toString(),
                    x: currentDrawing.x,
                    y: currentDrawing.y,
                    width: currentDrawing.width,
                    height: currentDrawing.height,
                    color: "#e3f2fd",
                    borderColor: "#2196f3",
                    title: "Container",
                });
                onStopDrawingContainer();
            }
        }

        setIsDrawing(false);
        setDrawingStart(null);
        setCurrentDrawing(null);
    };

    // Handle canvas click to deselect when clicking empty space
    const handleCanvasClick = (e) => {
        // Only deselect if clicking directly on the canvas (not on nodes or containers)
        if (e.target === canvasRef.current && !isDrawingContainer) {
            if (onClearAllSelections) {
                onClearAllSelections();
            }
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
            // Adjust for zoom so drop matches visible grid
            const scaledX = (e.clientX - rect.left) / zoom;
            const scaledY = (e.clientY - rect.top) / zoom;
            const rawX = scaledX - 60; // Offset to center the 120px wide node
            const rawY = scaledY - 40; // Offset to center the 80px tall node

            // Snap to grid (20px)
            const gridSize = 20;
            let snappedX = Math.round(rawX / gridSize) * gridSize;
            let snappedY = Math.round(rawY / gridSize) * gridSize;

            const position = { x: snappedX, y: snappedY };

            onAddNode(nodeType, position);
        }
        e.dataTransfer.dropEffect = "copy";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // Deselect node when clicking anywhere in canvas-container (outside nodes)
    const handleContainerClick = (e) => {
        // Only deselect if the click is NOT inside a node
        if (
            !e.target.classList.contains("flowchart-node") &&
            !e.target.closest(".flowchart-node") &&
            !e.target.closest(".MuiIconButton-root") && // Don't deselect when clicking delete button
            !e.target.closest(".connection-port") // Don't deselect when clicking connection ports
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
        // Add margin for scrolling
        maxX = maxX + margin;
        maxY = maxY + margin;
    }

    const canvasStyle = {
        position: "relative",
        width: Math.max(maxX, 1200),
        height: Math.max(maxY, 800),
        minWidth: "100vw",
        minHeight: "100vh",
    };

    return (
        <div
            className="canvas-container"
            onClick={handleContainerClick}
            style={{
                overflow: "auto",
                width: "100%",
                height: "100%",
                position: "relative",
                border: isDrawingContainer ? "3px dashed #4caf50" : "none",
                borderRadius: isDrawingContainer ? "8px" : "0",
                boxShadow: isDrawingContainer
                    ? "inset 0 0 20px rgba(76, 175, 80, 0.1)"
                    : "none",
                transition: "all 0.3s ease",
                cursor: isDrawingContainer ? "crosshair" : "default",
            }}
            onWheel={handleWheel}
        >
            <div
                ref={canvasRef}
                className="canvas"
                style={{
                    ...canvasStyle,
                    transform: `scale(${zoom})`,
                    transformOrigin: "0 0",
                    background: "none",
                }}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {/* Container drawing mode background overlay */}
                {isDrawingContainer && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(33, 150, 243, 0.03)",
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                    />
                )}

                {/* Render containers first (behind nodes) */}
                {containers.map((container) => (
                    <Container
                        key={container.id}
                        container={container}
                        isSelected={
                            selectedContainer === container.id ||
                            selectedContainers.includes(container.id)
                        }
                        onSelect={(containerId, event) => {
                            if (event && (event.ctrlKey || event.metaKey)) {
                                onToggleContainerSelection(containerId, true);
                            } else {
                                onSelectContainer(containerId);
                            }
                        }}
                        onUpdate={(containerId, updates) => {
                            // Check if this is a position update
                            if (
                                updates.hasOwnProperty("x") &&
                                updates.hasOwnProperty("y")
                            ) {
                                // Use group movement for position updates
                                onHandleGroupMovement(
                                    containerId,
                                    { x: updates.x, y: updates.y },
                                    true
                                );
                            } else {
                                // Use regular update for other properties (width, height, color, etc.)
                                onUpdateContainer(containerId, updates);
                            }
                        }}
                        onDelete={onDeleteContainer}
                        zoom={zoom}
                    />
                ))}

                {/* Drawing preview rectangle */}
                {currentDrawing && isDrawing && (
                    <div
                        style={{
                            position: "absolute",
                            left: currentDrawing.x,
                            top: currentDrawing.y,
                            width: currentDrawing.width,
                            height: currentDrawing.height,
                            border: "2px dashed #2196f3",
                            backgroundColor: "rgba(33, 150, 243, 0.1)",
                            pointerEvents: "none",
                            zIndex: 10,
                        }}
                    />
                )}

                {/* SVG overlay for connections */}
                <svg
                    className="connections-layer"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none", // Make SVG transparent to clicks
                        zIndex: 15, // Higher than containers but pointer events disabled
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
                        isSelected={
                            selectedNode === node.id ||
                            selectedNodes.includes(node.id)
                        }
                        isConnecting={isConnecting}
                        isConnectingFrom={
                            connectingFrom && connectingFrom.nodeId === node.id
                        }
                        onSelect={(nodeId, event) => {
                            if (event && (event.ctrlKey || event.metaKey)) {
                                onToggleNodeSelection(nodeId, true);
                            } else {
                                onSelectNode(nodeId);
                            }
                        }}
                        onUpdatePosition={(nodeId, newPosition) => {
                            onHandleGroupMovement(nodeId, newPosition, false);
                        }}
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
                            // ...existing code for getPortPosition and label rendering...
                            const getPortPosition = (node, port) => {
                                const nodeX = node.position.x;
                                const nodeY = node.position.y;
                                if (node.type === "decision") {
                                    const centerX = nodeX + 60;
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
                                const centerX = nodeX + 60;
                                const centerY = nodeY + 40;
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
