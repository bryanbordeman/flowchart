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
    isLocked,
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
    onOpenLinkedFile,
    zoom,
    onZoomWheel,
}) => {
    const canvasRef = useRef(null); // inner scaled world
    const containerRef = useRef(null); // scroll container

    // world-space drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingStart, setDrawingStart] = useState(null);
    const [currentDrawing, setCurrentDrawing] = useState(null);

    // Wheel event handler for zoom, attached with passive: false
    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handler = (e) => {
            if (onZoomWheel) onZoomWheel(e);
        };
        el.addEventListener("wheel", handler, { passive: false });
        return () => el.removeEventListener("wheel", handler);
    }, [onZoomWheel]);

    // Minimal, reliable screen->world using the scroll container
    const screenToWorld = (clientX, clientY) => {
        const cont = containerRef.current;
        if (!cont) return { x: 0, y: 0 };
        const rect = cont.getBoundingClientRect();
        const safeZoom = Math.max(zoom || 1, 0.0001);

        // account for border + padding
        const cs = window.getComputedStyle(cont);
        const padL = parseFloat(cs.paddingLeft || "0") || 0;
        const padT = parseFloat(cs.paddingTop || "0") || 0;

        const offsetX = clientX - rect.left - cont.clientLeft - padL;
        const offsetY = clientY - rect.top - cont.clientTop - padT;

        return {
            x: (cont.scrollLeft + offsetX) / safeZoom,
            y: (cont.scrollTop + offsetY) / safeZoom,
        };
    };

    // Start/drag/end on the OUTER container so you can draw anywhere you can see/scroll
    const handleContainerMouseDown = (e) => {
        if (!isDrawingContainer) return;

        // ignore interactive bits
        const isOnNode =
            e.target.classList?.contains("flowchart-node") ||
            e.target.closest?.(".flowchart-node");
        const isOnContainerEl =
            e.target.classList?.contains("flowchart-container") ||
            e.target.closest?.(".flowchart-container");
        const isOnButton = e.target.closest?.(".MuiIconButton-root");
        const isOnPort = e.target.closest?.(".connection-port");
        if (isOnNode || isOnContainerEl || isOnButton || isOnPort) return;

        const start = screenToWorld(e.clientX, e.clientY);
        setIsDrawing(true);
        setDrawingStart(start);
        setCurrentDrawing({ x: start.x, y: start.y, width: 0, height: 0 });
        e.preventDefault();
    };

    const handleContainerMouseMove = (e) => {
        if (!isDrawing || !isDrawingContainer || !drawingStart) return;
        const p = screenToWorld(e.clientX, e.clientY);
        const width = Math.abs(p.x - drawingStart.x);
        const height = Math.abs(p.y - drawingStart.y);
        const startX = Math.min(p.x, drawingStart.x);
        const startY = Math.min(p.y, drawingStart.y);
        setCurrentDrawing({ x: startX, y: startY, width, height });
    };

    const handleContainerMouseUp = () => {
        if (isDrawing && currentDrawing && isDrawingContainer) {
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

    const handleCanvasClick = (e) => {
        if (e.target === canvasRef.current && !isDrawingContainer) {
            onClearAllSelections?.();
            if (isConnecting) onCancelConnection();
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const nodeType = e.dataTransfer.getData("nodeType");
        if (nodeType) {
            const p = screenToWorld(e.clientX, e.clientY);
            const rawX = p.x - 60; // center 120x80
            const rawY = p.y - 40;
            const gridSize = 20;
            onAddNode(nodeType, {
                x: Math.round(rawX / gridSize) * gridSize,
                y: Math.round(rawY / gridSize) * gridSize,
            });
        }
        e.dataTransfer.dropEffect = "copy";
    };
    const handleDragOver = (e) => e.preventDefault();

    const handleContainerClick = (e) => {
        if (e.ctrlKey || e.metaKey) return;
        const isOnNode =
            e.target.classList?.contains("flowchart-node") ||
            e.target.closest?.(".flowchart-node");
        const isOnContainerEl =
            e.target.classList?.contains("flowchart-container") ||
            e.target.closest?.(".flowchart-container");
        const isOnButton = e.target.closest?.(".MuiIconButton-root");
        const isOnPort = e.target.closest?.(".connection-port");
        if (!isOnNode && !isOnContainerEl && !isOnButton && !isOnPort) {
            onClearAllSelections?.();
            if (isConnecting) onCancelConnection();
        }
    };

    // ---- sizing: include nodes + containers and ensure ≥ viewport/zoom
    const margin = 600;
    let minX = 0,
        minY = 0,
        maxX = 1200,
        maxY = 800;

    if (nodes.length) {
        minX = Math.min(minX, ...nodes.map((n) => n.position.x));
        minY = Math.min(minY, ...nodes.map((n) => n.position.y));
        maxX = Math.max(
            maxX,
            ...nodes.map((n) => n.position.x + (n.width || 120))
        );
        maxY = Math.max(
            maxY,
            ...nodes.map(
                (n) =>
                    n.position.y +
                    (n.height || (n.type === "decision" ? 120 : 80))
            )
        );
    }
    if (containers.length) {
        minX = Math.min(minX, ...containers.map((c) => c.x));
        minY = Math.min(minY, ...containers.map((c) => c.y));
        maxX = Math.max(maxX, ...containers.map((c) => c.x + c.width));
        maxY = Math.max(maxY, ...containers.map((c) => c.y + c.height));
    }

    maxX += margin;
    maxY += margin;

    const viewportW = containerRef.current?.clientWidth || window.innerWidth;
    const viewportH = containerRef.current?.clientHeight || window.innerHeight;
    const safeZoom = Math.max(zoom || 1, 0.0001);
    const neededW = viewportW / safeZoom;
    const neededH = viewportH / safeZoom;

    const worldSize = {
        width: Math.max(maxX, 1200, neededW),
        height: Math.max(maxY, 800, neededH),
    };

    const canvasStyle = {
        position: "relative",
        width: worldSize.width,
        height: worldSize.height,
        minWidth: "100vw",
        minHeight: "100vh",
    };

    return (
        <div
            ref={containerRef}
            className="canvas-container"
            onClick={handleContainerClick}
            style={{
                overflow: "auto",
                width: "100%",
                height: "100%",
                position: "relative",
                border: isLocked
                    ? "2px solid #008093"
                    : isDrawingContainer
                    ? "2px dashed #2196f3"
                    : "none",
                borderRadius: isLocked
                    ? "4px"
                    : isDrawingContainer
                    ? "8px"
                    : "0",
                backgroundColor: isLocked
                    ? "rgba(0,128,147,0.02)"
                    : "transparent",
                boxShadow: isDrawingContainer
                    ? "inset 0 0 20px rgba(33,150,243,0.1)"
                    : isLocked
                    ? "0 2px 8px rgba(0,128,147,0.3)"
                    : "none",
                transition: "all 0.3s ease",
                cursor: isDrawingContainer ? "crosshair" : "default",
                animation: isDrawingContainer
                    ? "borderPulse 2s infinite"
                    : "none",
            }}
            // ...existing code...
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleContainerMouseMove}
            onMouseUp={handleContainerMouseUp}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <style>
                {`
          @keyframes borderPulse {
            0% { border-color: #007AFF; box-shadow: inset 0 0 20px rgba(0,122,255,0.2), 0 0 0 0 rgba(0,122,255,0.5); }
            20% { border-color: #5856D6; box-shadow: inset 0 0 25px rgba(88,86,214,0.25), 0 0 0 4px rgba(88,86,214,0.3); }
            40% { border-color: #AF52DE; box-shadow: inset 0 0 30px rgba(175,82,222,0.3), 0 0 0 8px rgba(175,82,222,0.2); }
            60% { border-color: #FF2D92; box-shadow: inset 0 0 25px rgba(255,45,146,0.25), 0 0 0 6px rgba(255,45,146,0.25); }
            80% { border-color: #5856D6; box-shadow: inset 0 0 25px rgba(88,86,214,0.25), 0 0 0 4px rgba(88,86,214,0.3); }
            100% { border-color: #007AFF; box-shadow: inset 0 0 20px rgba(0,122,255,0.2), 0 0 0 0 rgba(0,122,255,0.5); }
          }
        `}
            </style>

            {/* world overlay: same size & transform as the canvas, sits above it; preview renders here */}
            <div
                className="world-overlay"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: worldSize.width,
                    height: worldSize.height,
                    transform: `scale(${zoom})`,
                    transformOrigin: "0 0",
                    pointerEvents: "none",
                    zIndex: 2, // above canvas content for visibility
                }}
            >
                {isDrawingContainer && isDrawing && currentDrawing && (
                    <div
                        style={{
                            position: "absolute",
                            left: currentDrawing.x,
                            top: currentDrawing.y,
                            width: currentDrawing.width,
                            height: currentDrawing.height,
                            border: "2px dashed #2196f3",
                            backgroundColor: "rgba(33,150,243,0.1)",
                        }}
                    />
                )}
            </div>

            {/* inner scaled canvas (all actual content) */}
            <div
                ref={canvasRef}
                className="canvas"
                style={{
                    ...canvasStyle,
                    transform: `scale(${zoom})`,
                    transformOrigin: "0 0",
                    background: "none",
                    position: "relative",
                    zIndex: 1,
                }}
                onClick={handleCanvasClick}
            >
                {/* optional tinted overlay when drawing */}
                {isDrawingContainer && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                    />
                )}

                {/* containers */}
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
                            if (
                                Object.prototype.hasOwnProperty.call(
                                    updates,
                                    "x"
                                ) &&
                                Object.prototype.hasOwnProperty.call(
                                    updates,
                                    "y"
                                )
                            ) {
                                onHandleGroupMovement(
                                    containerId,
                                    { x: updates.x, y: updates.y },
                                    true
                                );
                            } else {
                                onUpdateContainer(containerId, updates);
                            }
                        }}
                        onDelete={onDeleteContainer}
                        zoom={zoom}
                    />
                ))}

                {/* connections */}
                <svg
                    className="connections-layer"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        zIndex: 15,
                    }}
                >
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

                {/* nodes */}
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
                        onOpenLinkedFile={onOpenLinkedFile}
                    />
                ))}

                {/* decision labels layer */}
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
                />

                {/* watermark */}
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
                        style={{ width: 200, height: "auto" }}
                    />
                </div>

                {/* empty state */}
                {nodes.length === 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            textAlign: "center",
                            color: "#999",
                            fontSize: 18,
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 24,
                                fontWeight: 500,
                                marginBottom: 12,
                                color: "#666",
                            }}
                        >
                            📊 Welcome to Workflow Navigator
                        </div>
                        <div
                            style={{
                                fontSize: 16,
                                lineHeight: 1.6,
                                color: "#888",
                                maxWidth: 400,
                            }}
                        >
                            <div style={{ marginBottom: 3 }}>
                                • Drag flowchart symbols from sidebar to canvas
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Canvas;
