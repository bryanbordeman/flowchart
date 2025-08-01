import React, { useState, useEffect, useCallback } from "react";
import Canvas from "./components/Canvas";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import StatusBar from "./components/StatusBar";
import DecisionSelector from "./components/DecisionSelector";
import "./App.css";

function App() {
    // Zoom state
    const [zoom, setZoom] = useState(1);

    // Mouse wheel zoom handler
    const handleZoomWheel = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            let delta = e.deltaY < 0 ? 0.1 : -0.1;
            setZoom((prev) =>
                Math.min(2, Math.max(0.2, +(prev + delta).toFixed(2)))
            );
        }
    }, []);
    const [nodes, setNodes] = useState([]);
    const [connections, setConnections] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [currentFile, setCurrentFile] = useState(null);
    const [title, setTitle] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectingFrom, setConnectingFrom] = useState(null);
    const [showDecisionSelector, setShowDecisionSelector] = useState(false);
    const [pendingConnection, setPendingConnection] = useState(null);
    const [segments, setSegments] = useState([
        { id: "default", name: "Default", color: "#FFFFFF" },
        { id: "sales", name: "Sales", color: "#C8E6C9" },
        { id: "engineering", name: "Engineering", color: "#BBDEFB" },
        { id: "accounting", name: "Accounting", color: "#FFF9C4" },
        { id: "operations", name: "Operations", color: "#B2EBF2" },
        { id: "purchasing", name: "Purchasing", color: "#E1BEE7" },
        { id: "field", name: "Field", color: "#FFCC80" },
        { id: "shop", name: "Shop", color: "#FFCDD2" },
    ]);

    // Generate unique ID for nodes
    const generateId = () => Date.now().toString();

    // Add a new node to the canvas
    const addNode = useCallback((type, position) => {
        const newNode = {
            id: generateId(),
            type: type,
            position: position,
            text: getDefaultText(type),
            segment: "default", // Default segment for new nodes
            document: null, // Single document attachment
        };
        setNodes((prev) => [...prev, newNode]);
        setIsDirty(true);
    }, []);

    // Get default text for node types
    const getDefaultText = (type) => {
        switch (type) {
            case "start-end":
                return "Start/End";
            case "process":
                return "Process";
            case "decision":
                return "Decision?";
            case "input-output":
                return "Input/Output";
            case "connector":
                return "";
            default:
                return "Node";
        }
    };

    // Update node position
    const updateNodePosition = useCallback((id, newPosition) => {
        setNodes((prev) =>
            prev.map((node) =>
                node.id === id ? { ...node, position: newPosition } : node
            )
        );
        setIsDirty(true);
    }, []);

    // Update node text
    const updateNodeText = useCallback((id, newText) => {
        setNodes((prev) =>
            prev.map((node) =>
                node.id === id ? { ...node, text: newText } : node
            )
        );
        setIsDirty(true);
    }, []);

    // Update node properties (text, color, etc.)
    const updateNode = useCallback((id, updates) => {
        setNodes((prev) =>
            prev.map((node) =>
                node.id === id ? { ...node, ...updates } : node
            )
        );
        setIsDirty(true);
    }, []);

    // Update title
    const updateTitle = useCallback((newTitle) => {
        setTitle(newTitle);
        setIsDirty(true);
    }, []);

    // Delete a node
    const deleteNode = useCallback(
        (id) => {
            setNodes((prev) => prev.filter((node) => node.id !== id));
            // Also delete connections involving this node
            setConnections((prev) =>
                prev.filter((conn) => conn.from !== id && conn.to !== id)
            );
            if (selectedNode === id) {
                setSelectedNode(null);
            }
            setIsDirty(true);
        },
        [selectedNode]
    );

    // Segment management functions
    const addSegment = useCallback((segment) => {
        setSegments((prev) => [...prev, segment]);
        setIsDirty(true);
    }, []);

    const deleteSegment = useCallback((segmentId) => {
        // Don't delete the default segment
        if (segmentId === "default") return;

        setSegments((prev) =>
            prev.filter((segment) => segment.id !== segmentId)
        );

        // Update nodes that were using this segment to use default
        setNodes((prev) =>
            prev.map((node) =>
                node.segment === segmentId
                    ? { ...node, segment: "default" }
                    : node
            )
        );

        setIsDirty(true);
    }, []);

    const updateSegment = useCallback((segmentId, updates) => {
        setSegments((prev) =>
            prev.map((segment) =>
                segment.id === segmentId ? { ...segment, ...updates } : segment
            )
        );
        setIsDirty(true);
    }, []);

    // Start connection mode
    const startConnection = useCallback((fromNodeId, fromPort = "right") => {
        setIsConnecting(true);
        setConnectingFrom({ nodeId: fromNodeId, port: fromPort });
    }, []);

    // Complete connection
    const completeConnection = useCallback(
        (toNodeId, toPort = "left") => {
            if (
                isConnecting &&
                connectingFrom &&
                connectingFrom.nodeId !== toNodeId
            ) {
                // Check if connecting from a decision node
                const fromNode = nodes.find(
                    (n) => n.id === connectingFrom.nodeId
                );
                if (fromNode && fromNode.type === "decision") {
                    // Show decision selector for Yes/No choice
                    setPendingConnection({
                        from: connectingFrom.nodeId,
                        to: toNodeId,
                        fromPort: connectingFrom.port,
                        toPort: toPort,
                    });
                    setShowDecisionSelector(true);
                } else {
                    // Create regular connection
                    const newConnection = {
                        id: generateId(),
                        from: connectingFrom.nodeId,
                        to: toNodeId,
                        fromPort: connectingFrom.port,
                        toPort: toPort,
                    };
                    setConnections((prev) => [...prev, newConnection]);
                    setIsDirty(true);
                }
            }
            setIsConnecting(false);
            setConnectingFrom(null);
        },
        [isConnecting, connectingFrom, nodes]
    );

    // Complete decision connection with Yes/No choice
    const completeDecisionConnection = useCallback(
        (decisionType) => {
            if (pendingConnection) {
                const newConnection = {
                    id: generateId(),
                    from: pendingConnection.from,
                    to: pendingConnection.to,
                    fromPort: pendingConnection.fromPort,
                    toPort: pendingConnection.toPort,
                    decisionType: decisionType, // "yes" or "no"
                };
                setConnections((prev) => [...prev, newConnection]);
                setIsDirty(true);
            }
            setShowDecisionSelector(false);
            setPendingConnection(null);
        },
        [pendingConnection]
    );

    // Cancel decision connection
    const cancelDecisionConnection = useCallback(() => {
        setShowDecisionSelector(false);
        setPendingConnection(null);
    }, []);

    // Cancel connection
    const cancelConnection = useCallback(() => {
        setIsConnecting(false);
        setConnectingFrom(null);
    }, []);

    // Delete a connection
    const deleteConnection = useCallback((connectionId) => {
        setConnections((prev) =>
            prev.filter((conn) => conn.id !== connectionId)
        );
        setIsDirty(true);
    }, []);

    // Clear all nodes
    const clearCanvas = useCallback(() => {
        setNodes([]);
        setConnections([]);
        setSelectedNode(null);
        setCurrentFile(null);
        setTitle("");
        setIsDirty(false);
        cancelConnection();
    }, [cancelConnection]);

    // Save file
    const saveFile = useCallback(async () => {
        const data = JSON.stringify({ title, nodes, connections }, null, 2);

        if (window.electronAPI) {
            const result = await window.electronAPI.saveFile(data, title);
            if (result.success) {
                setCurrentFile(result.filePath);
                setIsDirty(false);
            } else {
                alert("Error saving file: " + result.error);
            }
        } else {
            // Web fallback - download as file
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            // Use title as filename, fallback to "flowchart" if no title
            const filename =
                title && title.trim()
                    ? `${title
                          .trim()
                          .replace(/[^\w\s-]/g, "")
                          .replace(/\s+/g, "_")}.json`
                    : "flowchart.json";
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            setIsDirty(false);
        }
    }, [title, nodes, connections]);

    // Load file data
    const loadFile = useCallback(
        (data) => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.nodes && Array.isArray(parsed.nodes)) {
                    setNodes(parsed.nodes);
                    // Load connections if they exist, otherwise empty array
                    setConnections(parsed.connections || []);
                    // Load title if it exists, otherwise empty string
                    setTitle(parsed.title || "");
                    setSelectedNode(null);
                    setIsDirty(false);
                    cancelConnection();
                } else {
                    alert("Invalid file format");
                }
            } catch (error) {
                alert("Error loading file: " + error.message);
            }
        },
        [cancelConnection]
    );

    // Load file dialog
    const loadFileDialog = useCallback(async () => {
        if (isDirty) {
            const result = window.confirm(
                "You have unsaved changes. Load file anyway?"
            );
            if (!result) return;
        }

        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.openFile();
                if (result.success) {
                    loadFile(result.data);
                    setCurrentFile(result.filePath);
                } else if (result.error !== "Open canceled") {
                    alert("Error opening file: " + result.error);
                }
            } catch (error) {
                alert("Error opening file: " + error.message);
            }
        } else {
            // Web fallback - file input
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".flowchart,.json";
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        loadFile(event.target.result);
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        }
    }, [isDirty, loadFile]);

    // Set up Electron menu handlers
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.onMenuNewFile(() => {
                if (isDirty) {
                    const result = window.confirm(
                        "You have unsaved changes. Create new file anyway?"
                    );
                    if (!result) return;
                }
                clearCanvas();
            });

            window.electronAPI.onMenuOpenFile((event, data) => {
                if (isDirty) {
                    const result = window.confirm(
                        "You have unsaved changes. Open file anyway?"
                    );
                    if (!result) return;
                }
                loadFile(data);
            });

            window.electronAPI.onMenuSaveFile(() => {
                saveFile();
            });

            window.electronAPI.onMenuSaveAsFile(() => {
                saveFile();
            });

            return () => {
                window.electronAPI.removeAllListeners("menu-new-file");
                window.electronAPI.removeAllListeners("menu-open-file");
                window.electronAPI.removeAllListeners("menu-save-file");
                window.electronAPI.removeAllListeners("menu-save-as-file");
            };
        }
    }, [isDirty, clearCanvas, loadFile, saveFile]);

    return (
        <>
            <div className="app">
                <Toolbar
                    onNew={clearCanvas}
                    onLoad={loadFileDialog}
                    onSave={saveFile}
                    title={title}
                    onTitleChange={updateTitle}
                    isDirty={isDirty}
                    currentFile={currentFile}
                />

                <div className="main-content" style={{ position: "relative" }}>
                    <Sidebar
                        onAddNode={addNode}
                        segments={segments}
                        onAddSegment={addSegment}
                        onDeleteSegment={deleteSegment}
                        onUpdateSegment={updateSegment}
                    />

                    <Canvas
                        nodes={nodes}
                        connections={connections}
                        selectedNode={selectedNode}
                        isConnecting={isConnecting}
                        connectingFrom={connectingFrom}
                        segments={segments}
                        onSelectNode={setSelectedNode}
                        onUpdateNodePosition={updateNodePosition}
                        onUpdateNodeText={updateNodeText}
                        onUpdateNode={updateNode}
                        onDeleteNode={deleteNode}
                        onAddNode={addNode}
                        onStartConnection={startConnection}
                        onCompleteConnection={completeConnection}
                        onCancelConnection={cancelConnection}
                        onDeleteConnection={deleteConnection}
                        zoom={zoom}
                        onZoomWheel={handleZoomWheel}
                    />

                    {/* Zoom slider in bottom right */}
                    <div
                        style={{
                            position: "absolute",
                            right: 24,
                            bottom: 24,
                            zIndex: 200,
                        }}
                    >
                        <div
                            style={{
                                background: "#fff",
                                borderRadius: 8,
                                boxShadow: "0 2px 8px #0002",
                                padding: 12,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <span style={{ marginRight: 8, fontWeight: 500 }}>
                                Zoom
                            </span>
                            <input
                                type="range"
                                min={0.2}
                                max={2}
                                step={0.01}
                                value={zoom}
                                onChange={(e) =>
                                    setZoom(Number(e.target.value))
                                }
                                style={{ width: 120 }}
                            />
                            <span
                                style={{
                                    marginLeft: 8,
                                    minWidth: 40,
                                    textAlign: "right",
                                }}
                            >
                                {Math.round(zoom * 100)}%
                            </span>
                        </div>
                    </div>

                    {/* Decision Connection Selector (Material UI) */}
                    <DecisionSelector
                        open={showDecisionSelector}
                        onSelect={completeDecisionConnection}
                        onCancel={cancelDecisionConnection}
                    />
                </div>

                <StatusBar
                    nodeCount={nodes.length}
                    connectionCount={connections.length}
                    selectedNode={selectedNode}
                    isDirty={isDirty}
                    isConnecting={isConnecting}
                />
            </div>
        </>
    );
}

export default App;
