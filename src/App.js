import React, { useState, useEffect, useCallback } from "react";
import Canvas from "./components/Canvas";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import StatusBar from "./components/StatusBar";
import DecisionSelector from "./components/DecisionSelector";
import workflowLogo from "./assets/workflow_navigator_logo.svg";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
    ThemeProvider,
    createTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import WarningIcon from "@mui/icons-material/Warning";
import CloseIcon from "@mui/icons-material/Close";
import "./App.css";

// Create custom theme with company colors
const theme = createTheme({
    palette: {
        primary: {
            main: "#008093", // Albatross Petrol
            light: "#4fb3c4",
            dark: "#005a65",
            contrastText: "#ffffff",
        },
        secondary: {
            main: "#40444e", // Graphit-Grey for secondary actions
            light: "#6c6c6c",
            dark: "#2c2c2c",
            contrastText: "#ffffff",
        },
        error: {
            main: "#f44336", // Keep red for destructive actions
            light: "#ff7961",
            dark: "#ba000d",
            contrastText: "#ffffff",
        },
        warning: {
            main: "#007f9b", // Petrol-Blue for warnings
            light: "#4fb3c4",
            dark: "#005a65",
            contrastText: "#ffffff",
        },
        info: {
            main: "#01557f", // Blue for information
            light: "#4fb3c4",
            dark: "#003d5a",
            contrastText: "#ffffff",
        },
        success: {
            main: "#7dc4a3", // Petrol-Green for success
            light: "#a8d4c0",
            dark: "#5a9e7d",
            contrastText: "#ffffff",
        },
        grey: {
            50: "#fafafa",
            100: "#f5f5f5",
            200: "#eeeeee",
            300: "#e0e0e0",
            400: "#bdbdbd",
            500: "#9e9e9e",
            600: "#757575",
            700: "#616161",
            800: "#424242",
            900: "#212121",
        },
        background: {
            default: "#ffffff",
            paper: "#ffffff",
        },
        text: {
            primary: "#212121",
            secondary: "#757575",
        },
    },
    components: {
        // Ensure icons in buttons use proper colors
        MuiButton: {
            styleOverrides: {
                root: {
                    "& .MuiSvgIcon-root": {
                        color: "inherit",
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    "&.MuiIconButton-colorPrimary": {
                        color: "#008093",
                        "&:hover": {
                            backgroundColor: "rgba(0, 128, 147, 0.04)",
                        },
                    },
                    "&.MuiIconButton-colorSecondary": {
                        color: "#40444e",
                        "&:hover": {
                            backgroundColor: "rgba(64, 68, 78, 0.04)",
                        },
                    },
                },
            },
        },
    },
});

const StyledDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialog-paper": {
        backgroundColor: "white",
        borderRadius: "8px",
        padding: theme.spacing(2),
        maxWidth: "600px",
        width: "90%",
    },
    "& .MuiDialogContent-root": {
        padding: theme.spacing(3),
        paddingTop: theme.spacing(1),
    },
    "& .MuiDialogActions-root": {
        padding: theme.spacing(2),
        paddingTop: 0,
        gap: theme.spacing(1.5),
    },
}));

function App() {
    // Loading state
    const [showLoadingModal, setShowLoadingModal] = useState(true);
    const [loadingFadeOut, setLoadingFadeOut] = useState(false);

    // No automatic fade out - only when user clicks a button

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
    const [selectedNodes, setSelectedNodes] = useState([]); // Multi-select nodes
    const [selectedContainers, setSelectedContainers] = useState([]); // Multi-select containers

    // Container state
    const [containers, setContainers] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [isDrawingContainer, setIsDrawingContainer] = useState(false);

    const [currentFile, setCurrentFile] = useState(null);
    const [title, setTitle] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectingFrom, setConnectingFrom] = useState(null);
    const [showDecisionSelector, setShowDecisionSelector] = useState(false);
    const [pendingConnection, setPendingConnection] = useState(null);

    // Unsaved changes dialog state
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [unsavedDialogAction, setUnsavedDialogAction] = useState(null);

    const [segments, setSegments] = useState([
        { id: "default", name: "Default", color: "#FFFFFF" },
        { id: "sales", name: "Sales", color: "#C8E6C9" }, // Light green
        { id: "engineering", name: "Engineering", color: "#BBDEFB" }, // Light blue
        { id: "accounting", name: "Accounting", color: "#FFF9C4" }, // Light yellow
        { id: "operations", name: "Operations", color: "#FFCC80" }, // Light orange
        { id: "purchasing", name: "Purchasing", color: "#E1BEE7" }, // Light purple
        { id: "field", name: "Field", color: "#FFCDD2" }, // Light pink
        { id: "shop", name: "Shop", color: "#B2EBF2" }, // Light cyan
    ]);

    // Undo/Redo state management
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const maxHistorySize = 50; // Limit history size for memory management

    // Save initial state to history
    useEffect(() => {
        if (history.length === 0) {
            const initialState = {
                nodes: [],
                connections: [],
                containers: [],
                segments: segments,
                title: "",
                timestamp: Date.now(),
            };
            setHistory([initialState]);
            setHistoryIndex(0);
        }
    }, []); // Only run once on mount

    // Generate unique ID for nodes
    const generateId = () => Date.now().toString();

    // Save current state to history for undo functionality
    const saveToHistory = useCallback(() => {
        const currentState = {
            nodes: [...nodes],
            connections: [...connections],
            containers: [...containers],
            segments: [...segments],
            title: title,
            timestamp: Date.now(),
        };

        setHistory((prev) => {
            // Remove any states after current index (for when we've undone some actions)
            const newHistory = prev.slice(0, historyIndex + 1);
            // Add new state
            newHistory.push(currentState);
            // Limit history size
            if (newHistory.length > maxHistorySize) {
                newHistory.shift();
                return newHistory;
            }
            return newHistory;
        });

        setHistoryIndex((prev) => {
            const newIndex = Math.min(prev + 1, maxHistorySize - 1);
            return newIndex;
        });
    }, [
        nodes,
        connections,
        containers,
        segments,
        title,
        historyIndex,
        maxHistorySize,
    ]);

    // Restore state from history
    const restoreFromHistory = useCallback(
        (stateIndex) => {
            if (stateIndex >= 0 && stateIndex < history.length) {
                const state = history[stateIndex];
                setNodes(state.nodes);
                setConnections(state.connections);
                setContainers(state.containers);
                setSegments(state.segments);
                setTitle(state.title);
                setHistoryIndex(stateIndex);
                setIsDirty(true);

                // Clear selections when undoing/redoing
                setSelectedNode(null);
                setSelectedNodes([]);
                setSelectedContainer(null);
                setSelectedContainers([]);
            }
        },
        [history]
    );

    // Undo function
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            restoreFromHistory(historyIndex - 1);
        }
    }, [historyIndex, restoreFromHistory]);

    // Redo function
    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            restoreFromHistory(historyIndex + 1);
        }
    }, [historyIndex, history.length, restoreFromHistory]);

    // Add a new node to the canvas
    const addNode = useCallback(
        (type, position) => {
            saveToHistory(); // Save state before making changes
            const newNode = {
                id: generateId(),
                type: type,
                position: position,
                text: getDefaultText(type),
                segment: "default", // Default segment for new nodes
                documents: [], // Multiple document attachments
                ...(type === "start-end" && { linkedFile: null }), // Add linked file property for start-end nodes
            };
            setNodes((prev) => [...prev, newNode]);
            setIsDirty(true);
        },
        [saveToHistory]
    ); // Get default text for node types
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
    const updateNodePosition = useCallback(
        (id, newPosition) => {
            saveToHistory(); // Save state before making changes
            setNodes((prev) =>
                prev.map((node) =>
                    node.id === id ? { ...node, position: newPosition } : node
                )
            );
            setIsDirty(true);
        },
        [saveToHistory]
    );

    // Update multiple node positions (for group movement)
    const updateMultipleNodePositions = useCallback(
        (updates) => {
            saveToHistory(); // Save state before making changes
            setNodes((prev) =>
                prev.map((node) => {
                    const update = updates.find((u) => u.id === node.id);
                    return update
                        ? { ...node, position: update.position }
                        : node;
                })
            );
            setIsDirty(true);
        },
        [saveToHistory]
    );

    // Update container position
    const updateContainerPosition = useCallback(
        (id, newPosition) => {
            saveToHistory(); // Save state before making changes
            setContainers((prev) =>
                prev.map((container) =>
                    container.id === id
                        ? { ...container, x: newPosition.x, y: newPosition.y }
                        : container
                )
            );
            setIsDirty(true);
        },
        [saveToHistory]
    );

    // Update multiple container positions (for group movement)
    const updateMultipleContainerPositions = useCallback((updates) => {
        setContainers((prev) =>
            prev.map((container) => {
                const update = updates.find((u) => u.id === container.id);
                return update
                    ? { ...container, x: update.x, y: update.y }
                    : container;
            })
        );
        setIsDirty(true);
    }, []);

    // Handle group movement when dragging a selected item
    const handleGroupMovement = useCallback(
        (draggedId, newPosition, isContainer = false) => {
            if (isContainer) {
                // Handle container group movement
                if (selectedContainers.includes(draggedId)) {
                    // Get the dragged container's current position
                    const draggedContainer = containers.find(
                        (c) => c.id === draggedId
                    );
                    if (!draggedContainer) return;

                    const deltaX = newPosition.x - draggedContainer.x;
                    const deltaY = newPosition.y - draggedContainer.y;

                    // Update all selected containers
                    const updates = selectedContainers
                        .map((containerId) => {
                            const container = containers.find(
                                (c) => c.id === containerId
                            );
                            if (!container) return null;
                            return {
                                id: containerId,
                                x: container.x + deltaX,
                                y: container.y + deltaY,
                            };
                        })
                        .filter(Boolean);

                    updateMultipleContainerPositions(updates);
                } else {
                    // Single container movement
                    updateContainerPosition(draggedId, newPosition);
                }
            } else {
                // Handle node group movement
                if (selectedNodes.includes(draggedId)) {
                    // Get the dragged node's current position
                    const draggedNode = nodes.find((n) => n.id === draggedId);
                    if (!draggedNode) return;

                    const deltaX = newPosition.x - draggedNode.position.x;
                    const deltaY = newPosition.y - draggedNode.position.y;

                    // Update all selected nodes
                    const updates = selectedNodes
                        .map((nodeId) => {
                            const node = nodes.find((n) => n.id === nodeId);
                            if (!node) return null;
                            return {
                                id: nodeId,
                                position: {
                                    x: node.position.x + deltaX,
                                    y: node.position.y + deltaY,
                                },
                            };
                        })
                        .filter(Boolean);

                    updateMultipleNodePositions(updates);
                } else {
                    // Single node movement
                    updateNodePosition(draggedId, newPosition);
                }
            }
        },
        [
            selectedNodes,
            selectedContainers,
            nodes,
            containers,
            updateNodePosition,
            updateContainerPosition,
            updateMultipleNodePositions,
            updateMultipleContainerPositions,
        ]
    );

    // Update node text
    const updateNodeText = useCallback(
        (id, newText) => {
            saveToHistory(); // Save state before text changes
            setNodes((prev) =>
                prev.map((node) =>
                    node.id === id ? { ...node, text: newText } : node
                )
            );
            setIsDirty(true);
        },
        [saveToHistory]
    );

    // Update node properties (text, color, etc.)
    const updateNode = useCallback(
        (id, updates) => {
            saveToHistory(); // Save state before property changes
            setNodes((prev) =>
                prev.map((node) =>
                    node.id === id ? { ...node, ...updates } : node
                )
            );
            setIsDirty(true);
        },
        [saveToHistory]
    );

    // Update title
    const updateTitle = useCallback((newTitle) => {
        setTitle(newTitle);
        setIsDirty(true);
    }, []);

    // Delete a node
    const deleteNode = useCallback(
        (id) => {
            saveToHistory(); // Save state before making changes
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
        [selectedNode, saveToHistory]
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
                    saveToHistory(); // Save state before making changes
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
        [isConnecting, connectingFrom, nodes, saveToHistory]
    );

    // Complete decision connection with Yes/No choice
    const completeDecisionConnection = useCallback(
        (decisionType) => {
            if (pendingConnection) {
                saveToHistory(); // Save state before making changes
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
        [pendingConnection, saveToHistory]
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
    const deleteConnection = useCallback(
        (connectionId) => {
            saveToHistory(); // Save state before deleting connection
            setConnections((prev) =>
                prev.filter((conn) => conn.id !== connectionId)
            );
            setIsDirty(true);
        },
        [saveToHistory]
    );

    // Container handlers
    const addContainer = useCallback(
        (container) => {
            saveToHistory(); // Save state before adding container
            setContainers((prev) => [...prev, container]);
            setIsDirty(true);
        },
        [saveToHistory]
    );

    const updateContainer = useCallback(
        (id, updates) => {
            // Don't save to history for every position update to avoid too many entries
            // Only save for significant changes (not just position)
            if (!updates.hasOwnProperty("x") && !updates.hasOwnProperty("y")) {
                saveToHistory();
            }
            setContainers((prev) =>
                prev.map((container) =>
                    container.id === id
                        ? { ...container, ...updates }
                        : container
                )
            );
            setIsDirty(true);
        },
        [saveToHistory]
    );

    const deleteContainer = useCallback(
        (id) => {
            saveToHistory(); // Save state before deleting container
            setContainers((prev) =>
                prev.filter((container) => container.id !== id)
            );
            setSelectedContainer(null);
            setIsDirty(true);
        },
        [saveToHistory]
    );

    const selectContainer = useCallback((id) => {
        setSelectedContainer(id);
        setSelectedNode(null); // Deselect node when selecting container
    }, []);

    // Multi-select functions
    const toggleNodeSelection = useCallback((nodeId, isCtrlKey = false) => {
        if (isCtrlKey) {
            // Multi-select mode
            setSelectedNodes((prev) => {
                if (prev.includes(nodeId)) {
                    // Remove from selection
                    return prev.filter((id) => id !== nodeId);
                } else {
                    // Add to selection
                    return [...prev, nodeId];
                }
            });
            // Clear single selections
            setSelectedNode(null);
            setSelectedContainer(null);
            setSelectedContainers([]);
        } else {
            // Single select mode
            setSelectedNode(nodeId);
            setSelectedNodes([]);
            setSelectedContainer(null);
            setSelectedContainers([]);
        }
    }, []);

    const toggleContainerSelection = useCallback(
        (containerId, isCtrlKey = false) => {
            if (isCtrlKey) {
                // Multi-select mode
                setSelectedContainers((prev) => {
                    if (prev.includes(containerId)) {
                        // Remove from selection
                        return prev.filter((id) => id !== containerId);
                    } else {
                        // Add to selection
                        return [...prev, containerId];
                    }
                });
                // Clear single selections
                setSelectedContainer(null);
                setSelectedNode(null);
                setSelectedNodes([]);
            } else {
                // Single select mode
                setSelectedContainer(containerId);
                setSelectedContainers([]);
                setSelectedNode(null);
                setSelectedNodes([]);
            }
        },
        []
    );

    const clearAllSelections = useCallback(() => {
        setSelectedNode(null);
        setSelectedNodes([]);
        setSelectedContainer(null);
        setSelectedContainers([]);
    }, []);

    // Delete multiple nodes at once
    const deleteSelectedNodes = useCallback(() => {
        if (selectedNodes.length > 0) {
            saveToHistory(); // Save state before deleting nodes
            setNodes((prev) =>
                prev.filter((node) => !selectedNodes.includes(node.id))
            );
            // Also delete connections involving these nodes
            setConnections((prev) =>
                prev.filter(
                    (conn) =>
                        !selectedNodes.includes(conn.from) &&
                        !selectedNodes.includes(conn.to)
                )
            );
            setSelectedNodes([]);
            setIsDirty(true);
        }
    }, [selectedNodes, saveToHistory]);

    // Delete multiple containers at once
    const deleteSelectedContainers = useCallback(() => {
        if (selectedContainers.length > 0) {
            saveToHistory(); // Save state before deleting containers
            setContainers((prev) =>
                prev.filter(
                    (container) => !selectedContainers.includes(container.id)
                )
            );
            setSelectedContainers([]);
            setIsDirty(true);
        }
    }, [selectedContainers, saveToHistory]);

    const toggleDrawingContainer = useCallback(() => {
        setIsDrawingContainer((prev) => !prev);
        if (isDrawingContainer) {
            // If stopping drawing mode, deselect any selected container
            setSelectedContainer(null);
        }
    }, [isDrawingContainer]);

    const startDrawingContainer = useCallback(() => {
        setIsDrawingContainer(true);
    }, []);

    const stopDrawingContainer = useCallback(() => {
        setIsDrawingContainer(false);
    }, []);

    // Clear all nodes
    const clearCanvas = useCallback(() => {
        setNodes([]);
        setConnections([]);
        setContainers([]);
        setSelectedNode(null);
        setSelectedNodes([]);
        setSelectedContainer(null);
        setSelectedContainers([]);
        setCurrentFile(null);
        setTitle("");
        setIsDirty(false);
        // Clear history when starting new
        setHistory([]);
        setHistoryIndex(-1);
        cancelConnection();
    }, [cancelConnection]);

    // Save file
    const saveFile = useCallback(async () => {
        const data = JSON.stringify(
            { title, nodes, connections, containers },
            null,
            2
        );

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
    }, [title, nodes, connections, containers]);

    // Load file data
    const loadFile = useCallback(
        (data) => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.nodes && Array.isArray(parsed.nodes)) {
                    setNodes(parsed.nodes);
                    // Load connections if they exist, otherwise empty array
                    setConnections(parsed.connections || []);
                    // Load containers if they exist, otherwise empty array
                    setContainers(parsed.containers || []);
                    // Load title if it exists, otherwise empty string
                    setTitle(parsed.title || "");
                    setSelectedNode(null);
                    setSelectedNodes([]);
                    setSelectedContainer(null);
                    setSelectedContainers([]);
                    setIsDirty(false);
                    // Clear history when loading new file
                    setHistory([]);
                    setHistoryIndex(-1);
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

    // Handle start modal button actions
    const handleStartModalAction = useCallback(
        async (action) => {
            if (action === "new") {
                // For new, immediately fade out and close modal
                setLoadingFadeOut(true);
                setTimeout(() => {
                    setShowLoadingModal(false);
                }, 500);
            } else if (action === "load") {
                // For load, open file dialog immediately without any delays
                if (window.electronAPI) {
                    try {
                        const result = await window.electronAPI.openFile();
                        if (result.success) {
                            // File was selected successfully, now fade out
                            setLoadingFadeOut(true);
                            // Load file immediately and close modal after fade
                            loadFile(result.data);
                            setCurrentFile(result.filePath);
                            setTimeout(() => {
                                setShowLoadingModal(false);
                            }, 500);
                        } else if (result.error !== "Open canceled") {
                            alert("Error opening file: " + result.error);
                        }
                        // If user canceled (Open canceled), modal stays visible
                    } catch (error) {
                        alert("Error opening file: " + error.message);
                    }
                } else {
                    // Web fallback - file input
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".wfn,.flowchart,.json";
                    input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            // File was selected successfully, now fade out
                            setLoadingFadeOut(true);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                loadFile(event.target.result);
                            };
                            reader.readAsText(file);
                            setTimeout(() => {
                                setShowLoadingModal(false);
                            }, 500);
                        }
                        // If no file selected, modal stays visible
                    };
                    input.click();
                }
            }
        },
        [loadFile]
    );

    // Load file dialog
    const loadFileDialog = useCallback(async () => {
        if (isDirty) {
            // Show custom dialog for load file
            setUnsavedDialogAction(() => async () => {
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
            });
            setShowUnsavedDialog(true);
            return;
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

    // Open linked flowchart file
    const openLinkedFile = useCallback(
        async (filePath) => {
            if (window.electronAPI) {
                try {
                    const result = await window.electronAPI.openLinkedFile(
                        filePath
                    );
                    if (result.success) {
                        if (isDirty) {
                            // Show custom dialog instead of window.confirm
                            setUnsavedDialogAction(() => () => {
                                loadFile(result.data);
                                setCurrentFile(filePath);
                            });
                            setShowUnsavedDialog(true);
                            return;
                        }
                        loadFile(result.data);
                        setCurrentFile(filePath);
                    } else {
                        alert("Error opening linked file: " + result.error);
                    }
                } catch (error) {
                    alert("Error opening linked file: " + error.message);
                }
            }
        },
        [isDirty, loadFile]
    );

    // Handle unsaved changes dialog actions
    const handleSaveAndContinue = useCallback(async () => {
        if (window.electronAPI) {
            try {
                const data = JSON.stringify(
                    {
                        nodes,
                        connections,
                        segments,
                        containers,
                        title,
                    },
                    null,
                    2
                );

                let result;
                if (currentFile) {
                    // Save directly to existing file without dialog
                    result = await window.electronAPI.saveFileDirect(
                        data,
                        currentFile
                    );
                } else {
                    // Show save dialog for new files
                    result = await window.electronAPI.saveFile(
                        data,
                        "untitled.flowchart"
                    );
                }

                if (result.success) {
                    setCurrentFile(result.filePath);
                    setIsDirty(false);
                    // Execute the pending action
                    if (unsavedDialogAction) {
                        unsavedDialogAction();
                    }
                } else {
                    alert("Error saving file: " + result.error);
                    return;
                }
            } catch (error) {
                alert("Error saving file: " + error.message);
                return;
            }
        }
        setShowUnsavedDialog(false);
        setUnsavedDialogAction(null);
    }, [
        nodes,
        connections,
        segments,
        containers,
        title,
        currentFile,
        unsavedDialogAction,
    ]);

    const handleContinueWithoutSaving = useCallback(() => {
        if (unsavedDialogAction) {
            unsavedDialogAction();
        }
        setShowUnsavedDialog(false);
        setUnsavedDialogAction(null);
    }, [unsavedDialogAction]);

    const handleCancelAction = useCallback(() => {
        setShowUnsavedDialog(false);
        setUnsavedDialogAction(null);
    }, []);

    // Set up Electron menu handlers
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.onMenuNewFile(() => {
                if (isDirty) {
                    setUnsavedDialogAction(() => () => {
                        clearCanvas();
                    });
                    setShowUnsavedDialog(true);
                    return;
                }
                clearCanvas();
            });

            window.electronAPI.onMenuOpenFile((event, dataOrObject) => {
                let data, filePath;

                // Handle both old format (just data) and new format (object with data and filePath)
                if (typeof dataOrObject === "string") {
                    data = dataOrObject;
                    filePath = null;
                } else if (dataOrObject && typeof dataOrObject === "object") {
                    data = dataOrObject.data;
                    filePath = dataOrObject.filePath;
                }

                if (isDirty) {
                    setUnsavedDialogAction(() => () => {
                        loadFile(data);
                        if (filePath) {
                            setCurrentFile(filePath);
                        }
                    });
                    setShowUnsavedDialog(true);
                    return;
                }
                loadFile(data);
                if (filePath) {
                    setCurrentFile(filePath);
                }
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

    // Handle keyboard events for deleting selected components
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Handle Ctrl+Z / Cmd+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }

            // Handle Ctrl+Shift+Z / Cmd+Shift+Z for redo
            if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
                e.preventDefault();
                redo();
                return;
            }

            // Handle Ctrl+Y / Cmd+Y for redo (alternative)
            if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                e.preventDefault();
                redo();
                return;
            }

            // Check if Delete or Backspace key is pressed
            if (e.key === "Delete" || e.key === "Backspace") {
                // Check if we're currently editing text in a node (focus is on textarea)
                const isEditingText =
                    document.activeElement &&
                    (document.activeElement.tagName === "TEXTAREA" ||
                        document.activeElement.tagName === "INPUT");

                // If we're editing text, let the default behavior handle text deletion
                if (isEditingText) {
                    return; // Don't prevent default, allow normal text deletion
                }

                // Prevent default behavior only if we have something selected and not editing text
                if (
                    selectedNode ||
                    selectedContainer ||
                    selectedNodes.length > 0 ||
                    selectedContainers.length > 0
                ) {
                    e.preventDefault();

                    // Delete selected single node
                    if (selectedNode) {
                        deleteNode(selectedNode);
                    }

                    // Delete selected single container
                    if (selectedContainer) {
                        deleteContainer(selectedContainer);
                    }

                    // Delete multiple selected nodes
                    if (selectedNodes.length > 0) {
                        deleteSelectedNodes();
                    }

                    // Delete multiple selected containers
                    if (selectedContainers.length > 0) {
                        deleteSelectedContainers();
                    }
                }
            }

            // Handle Escape key to clear all selections
            if (e.key === "Escape") {
                clearAllSelections();
            }
        };

        // Add event listener to document
        document.addEventListener("keydown", handleKeyDown);

        // Cleanup event listener
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        selectedNode,
        selectedContainer,
        selectedNodes,
        selectedContainers,
        deleteNode,
        deleteContainer,
        deleteSelectedNodes,
        deleteSelectedContainers,
        clearAllSelections,
        undo,
        redo,
    ]);

    return (
        <ThemeProvider theme={theme}>
            <div className={`app ${showLoadingModal ? "app-loading" : ""}`}>
                <Toolbar
                    onNew={clearCanvas}
                    onLoad={loadFileDialog}
                    onSave={saveFile}
                    title={title}
                    onTitleChange={updateTitle}
                    isDirty={isDirty}
                    currentFile={currentFile}
                    onUndo={undo}
                    onRedo={redo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                />

                <div className="main-content" style={{ position: "relative" }}>
                    <Sidebar
                        onAddNode={addNode}
                        segments={segments}
                        onAddSegment={addSegment}
                        onDeleteSegment={deleteSegment}
                        onUpdateSegment={updateSegment}
                        isDrawingContainer={isDrawingContainer}
                        onToggleDrawingContainer={toggleDrawingContainer}
                    />

                    <Canvas
                        nodes={nodes}
                        connections={connections}
                        selectedNode={selectedNode}
                        selectedNodes={selectedNodes}
                        selectedContainers={selectedContainers}
                        isConnecting={isConnecting}
                        connectingFrom={connectingFrom}
                        segments={segments}
                        containers={containers}
                        selectedContainer={selectedContainer}
                        isDrawingContainer={isDrawingContainer}
                        onSelectNode={setSelectedNode}
                        onToggleNodeSelection={toggleNodeSelection}
                        onToggleContainerSelection={toggleContainerSelection}
                        onClearAllSelections={clearAllSelections}
                        onUpdateNodePosition={updateNodePosition}
                        onHandleGroupMovement={handleGroupMovement}
                        onUpdateNodeText={updateNodeText}
                        onUpdateNode={updateNode}
                        onDeleteNode={deleteNode}
                        onAddNode={addNode}
                        onStartConnection={startConnection}
                        onCompleteConnection={completeConnection}
                        onCancelConnection={cancelConnection}
                        onDeleteConnection={deleteConnection}
                        onAddContainer={addContainer}
                        onUpdateContainer={updateContainer}
                        onDeleteContainer={deleteContainer}
                        onSelectContainer={selectContainer}
                        onStartDrawingContainer={startDrawingContainer}
                        onStopDrawingContainer={stopDrawingContainer}
                        onOpenLinkedFile={openLinkedFile}
                        zoom={zoom}
                        onZoomWheel={handleZoomWheel}
                    />

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
                    selectedNodes={selectedNodes}
                    selectedContainers={selectedContainers}
                    isDirty={isDirty}
                    isConnecting={isConnecting}
                    zoom={zoom}
                    onZoomChange={setZoom}
                />
            </div>

            {/* Loading Modal */}
            {showLoadingModal && (
                <div
                    className="loading-overlay"
                    style={{
                        opacity: loadingFadeOut ? 0 : 1,
                        transition: "opacity 0.5s ease-out",
                    }}
                >
                    <div
                        className="loading-content"
                        style={{
                            width: "600px",
                            height: "400px",
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "16px",
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            border: `2px solid ${theme.palette.primary.main}`,
                            padding: "20px",
                            position: "relative",
                        }}
                    >
                        {/* Logo */}
                        <img
                            src={workflowLogo}
                            alt="Workflow Navigator"
                            style={{
                                width: "500px",
                                height: "auto",
                                marginBottom: "30px",
                            }}
                        />

                        {/* Action Buttons */}
                        <div
                            style={{
                                display: "flex",
                                gap: "20px",
                                marginBottom: "30px",
                            }}
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleStartModalAction("new")}
                                sx={{
                                    padding: "12px 40px",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    borderRadius: "8px",
                                    minWidth: "120px",
                                }}
                            >
                                New
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => handleStartModalAction("load")}
                                sx={{
                                    padding: "12px 40px",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    borderRadius: "8px",
                                    minWidth: "120px",
                                }}
                            >
                                Load
                            </Button>
                        </div>

                        {/* Credits - Bottom Right Corner */}
                        <div
                            style={{
                                position: "absolute",
                                bottom: "10px",
                                left: "20px",
                                textAlign: "right",
                                color: theme.palette.text.secondary,
                                fontSize: "13px",
                                lineHeight: "1.4",
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: "bold",
                                    marginBottom: "4px",
                                }}
                            >
                                Author: Bryan Bordeman
                            </div>
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                bottom: "10px",
                                right: "20px",
                                textAlign: "right",
                                color: theme.palette.text.secondary,
                                fontSize: "13px",
                                lineHeight: "1.4",
                            }}
                        >
                            <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                Version 1.0.0
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Unsaved Changes Dialog */}
            <StyledDialog
                open={showUnsavedDialog}
                onClose={handleCancelAction}
                maxWidth="xs"
                fullWidth
                aria-labelledby="unsaved-changes-dialog-title"
            >
                <DialogTitle
                    id="unsaved-changes-dialog-title"
                    sx={{
                        color: "text.primary",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        pb: 1,
                    }}
                >
                    <WarningIcon
                        sx={{
                            color: "primary.main",
                            fontSize: "28px",
                        }}
                    />
                    Unsaved Changes
                    <IconButton
                        aria-label="close"
                        onClick={handleCancelAction}
                        color="secondary"
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography
                        sx={{
                            color: "text.primary",
                            fontSize: "16px",
                            lineHeight: 1.5,
                            textAlign: "center",
                        }}
                    >
                        You have unsaved changes. Save before continuing?
                    </Typography>
                </DialogContent>{" "}
                <DialogActions>
                    <Button
                        onClick={handleCancelAction}
                        variant="outlined"
                        sx={{
                            flex: 1,
                            color: "#666",
                            borderColor: "#ccc",
                            "&:hover": {
                                borderColor: "#999",
                                backgroundColor: "rgba(0, 0, 0, 0.04)",
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleContinueWithoutSaving}
                        variant="contained"
                        color="secondary"
                        sx={{
                            flex: 1,
                        }}
                    >
                        Don't Save
                    </Button>
                    <Button
                        onClick={handleSaveAndContinue}
                        variant="contained"
                        color="primary"
                        sx={{
                            flex: 1,
                        }}
                    >
                        Save & Continue
                    </Button>
                </DialogActions>
            </StyledDialog>
        </ThemeProvider>
    );
}

export default App;
