import React, { useState, useRef } from "react";
import Draggable from "react-draggable";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Chip,
    Stack,
    IconButton,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import {
    AttachFile,
    Delete,
    Visibility,
    Close,
    Edit,
} from "@mui/icons-material";

const FlowchartNode = ({
    node,
    segments,
    isSelected,
    isConnecting,
    isConnectingFrom,
    onSelect,
    onUpdatePosition,
    onUpdateText,
    onUpdateNode,
    onDelete,
    onStartConnection,
    onCompleteConnection,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(node.text);
    const [showEditModal, setShowEditModal] = useState(false);
    const inputRef = useRef(null);
    const nodeRef = useRef(null);

    const handleDoubleClick = () => {
        if (node.type !== "connector") {
            setIsEditing(true);
            setEditText(node.text);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    };

    const handleTextSubmit = () => {
        onUpdateText(node.id, editText);
        setIsEditing(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleTextSubmit();
        } else if (e.key === "Escape") {
            setEditText(node.text);
            setIsEditing(false);
        }
    };

    const handleDrag = (e, data) => {
        // Snap to grid (20px)
        const gridSize = 20;
        let snappedX = Math.round(data.x / gridSize) * gridSize;
        let snappedY = Math.round(data.y / gridSize) * gridSize;

        onUpdatePosition(node.id, { x: snappedX, y: snappedY });
    };

    const handleClick = (e) => {
        e.stopPropagation();
        if (isConnecting && !isConnectingFrom) {
            // Complete connection to this node
            onCompleteConnection(node.id);
        } else {
            onSelect(node.id);
        }
    };

    const handlePortClick = (e, portId) => {
        e.stopPropagation();
        if (isConnecting && !isConnectingFrom) {
            // Complete connection to this port
            onCompleteConnection(node.id, portId);
        }
    };

    const handlePortMouseDown = (e, portId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isConnecting) {
            // Start connection from this port with drag
            onStartConnection(node.id, portId);
        }
    };

    const handleRightClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Right-click disabled - use drag on connection ports instead
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(node.id);
    };

    const handleEditModal = (e) => {
        e.stopPropagation();
        setShowEditModal(true);
    };

    const handleSaveEdit = (newText, newSegment, newDocument) => {
        onUpdateNode(node.id, {
            text: newText,
            segment: newSegment,
            document: newDocument,
        });
        setShowEditModal(false);
    };

    const handleCancelEdit = () => {
        setShowEditModal(false);
    };

    const handleDocumentClick = async (e) => {
        e.stopPropagation();
        if (node.document) {
            try {
                const result = await window.electronAPI.openDocument(
                    node.document
                );
                if (!result.success) {
                    alert(
                        "Failed to open document: " +
                            (result.error || "Unknown error")
                    );
                }
            } catch (error) {
                console.error("Error opening document:", error);
                alert("Failed to open document");
            }
        }
    };

    // Dynamic styling based on connection state
    const getNodeClassName = () => {
        let className = `flowchart-node ${node.type}`;

        if (isSelected) className += " selected";
        if (isConnectingFrom) className += " connecting-from";
        if (isConnecting && !isConnectingFrom)
            className += " connection-target";
        return className;
    };

    // Get segment color for styling
    const getSegmentColor = () => {
        const segmentId = node.segment || "default";
        const segment = segments?.find((s) => s.id === segmentId);
        return segment?.color || "#ffffff";
    };

    return (
        <>
            <Draggable
                position={node.position}
                onDrag={handleDrag}
                handle=".node-content"
                grid={[20, 20]} // Grid snapping in Draggable
                disabled={isConnecting}
                nodeRef={nodeRef}
            >
                <div
                    ref={nodeRef}
                    className={getNodeClassName()}
                    style={
                        node.type === "decision"
                            ? { "--diamond-color": getSegmentColor() }
                            : { backgroundColor: getSegmentColor() }
                    }
                    onClick={handleClick}
                    onContextMenu={handleRightClick}
                    onDoubleClick={handleDoubleClick}
                    title={
                        isConnecting && !isConnectingFrom
                            ? "Click connection port to connect here"
                            : "Drag from connection ports to create connections"
                    }
                >
                    <IconButton
                        size="small"
                        onClick={handleDelete}
                        title="Delete node"
                        sx={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            width: 20,
                            height: 20,
                            backgroundColor: "white",
                            border: "1px solid #ddd",
                            "&:hover": {
                                backgroundColor: "#ffebee",
                                borderColor: "#f44336",
                            },
                        }}
                    >
                        <Delete sx={{ fontSize: 14 }} color="error" />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={handleEditModal}
                        title="Edit node properties"
                        sx={{
                            position: "absolute",
                            top: -6,
                            right: 16,
                            width: 20,
                            height: 20,
                            backgroundColor: "white",
                            border: "1px solid #ddd",
                            "&:hover": {
                                backgroundColor: "#e3f2fd",
                                borderColor: "#2196f3",
                            },
                        }}
                    >
                        <Edit sx={{ fontSize: 14 }} color="primary" />
                    </IconButton>

                    {/* Connection Ports */}
                    {node.type !== "connector" && (
                        <>
                            {/* Top Port */}
                            <div
                                className="connection-port port-top"
                                onClick={(e) => handlePortClick(e, "top")}
                                onMouseDown={(e) =>
                                    handlePortMouseDown(e, "top")
                                }
                                title="Drag to connect"
                            />
                            {/* Right Port */}
                            <div
                                className="connection-port port-right"
                                onClick={(e) => handlePortClick(e, "right")}
                                onMouseDown={(e) =>
                                    handlePortMouseDown(e, "right")
                                }
                                title="Drag to connect"
                            />
                            {/* Bottom Port */}
                            <div
                                className="connection-port port-bottom"
                                onClick={(e) => handlePortClick(e, "bottom")}
                                onMouseDown={(e) =>
                                    handlePortMouseDown(e, "bottom")
                                }
                                title="Drag to connect"
                            />
                            {/* Left Port */}
                            <div
                                className="connection-port port-left"
                                onClick={(e) => handlePortClick(e, "left")}
                                onMouseDown={(e) =>
                                    handlePortMouseDown(e, "left")
                                }
                                title="Drag to connect"
                            />
                        </>
                    )}

                    <div className="node-content">
                        {node.document && (
                            <IconButton
                                size="small"
                                onClick={handleDocumentClick}
                                title={`Click to open: ${node.document.fileName}`}
                                sx={{
                                    position: "absolute",
                                    bottom: -6,
                                    left: -6,
                                    width: 20,
                                    height: 20,
                                    backgroundColor: "white",
                                    border: "1px solid #ddd",
                                    "&:hover": {
                                        backgroundColor: "#f3e5f5",
                                        borderColor: "#9c27b0",
                                    },
                                }}
                            >
                                <AttachFile
                                    sx={{ fontSize: 14 }}
                                    color="secondary"
                                />
                            </IconButton>
                        )}
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onBlur={handleTextSubmit}
                                onKeyDown={handleKeyPress}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    textAlign: "center",
                                    width: "100%",
                                    fontSize: "inherit",
                                }}
                            />
                        ) : (
                            <span>{node.text}</span>
                        )}
                    </div>
                </div>
            </Draggable>

            {/* Edit Modal - rendered outside Draggable */}
            {showEditModal && (
                <EditNodeModal
                    node={node}
                    segments={segments}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                />
            )}
        </>
    );
};

// Edit Node Modal Component
const EditNodeModal = ({ node, segments, onSave, onCancel }) => {
    const [text, setText] = useState(node.text);
    const [segment, setSegment] = useState(node.segment || "default");
    const [document, setDocument] = useState(node.document || null);

    const handleSave = () => {
        onSave(text, segment, document);
    };

    const handleAttachDocument = async () => {
        try {
            const result = await window.electronAPI.attachDocument();
            if (result.success) {
                const newDocument = {
                    id: Date.now().toString(),
                    fileName: result.fileName,
                    data: result.data,
                    attachedAt: new Date().toISOString(),
                };
                setDocument(newDocument);
            } else {
                alert(
                    "Failed to attach document: " +
                        (result.error || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Error attaching document:", error);
            alert("Failed to attach document");
        }
    };

    const handleViewDocument = async () => {
        if (!document) return;
        try {
            const result = await window.electronAPI.openDocument(document);
            if (!result.success) {
                alert(
                    "Failed to open document: " +
                        (result.error || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Error opening document:", error);
            alert("Failed to open document");
        }
    };

    const handleRemoveDocument = () => {
        setDocument(null);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            onCancel();
        }
    };

    return (
        <Dialog
            open={true}
            onClose={onCancel}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Typography variant="h6">Edit Node</Typography>
                <IconButton onClick={onCancel} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pb: 1 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        mt: 1,
                    }}
                >
                    {/* Text Field */}
                    <TextField
                        fullWidth
                        label="Text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        autoFocus
                        variant="outlined"
                    />

                    {/* Segment Selection */}
                    <FormControl fullWidth>
                        <InputLabel id="segment-select-label">
                            Segment
                        </InputLabel>
                        <Select
                            labelId="segment-select-label"
                            value={segment}
                            label="Segment"
                            onChange={(e) => setSegment(e.target.value)}
                        >
                            <MenuItem value="default">
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: "50%",
                                            backgroundColor: "#FFFFFF",
                                            border: "2px solid #ddd",
                                        }}
                                    />
                                    Default
                                </Box>
                            </MenuItem>
                            {segments?.map((segmentOption) => (
                                <MenuItem
                                    key={segmentOption.id}
                                    value={segmentOption.id}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: "50%",
                                                backgroundColor:
                                                    segmentOption.color,
                                                border: "1px solid #ddd",
                                            }}
                                        />
                                        {segmentOption.name}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Document Attachment */}
                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Document:
                        </Typography>
                        {!document ? (
                            <Button
                                variant="outlined"
                                startIcon={<AttachFile />}
                                onClick={handleAttachDocument}
                                size="small"
                                sx={{ textTransform: "none" }}
                            >
                                Attach PDF
                            </Button>
                        ) : (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <Chip
                                        label={document.fileName}
                                        icon={<Visibility />}
                                        onClick={handleViewDocument}
                                        onDelete={handleRemoveDocument}
                                        deleteIcon={<Delete />}
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        sx={{ maxWidth: "300px" }}
                                    />
                                </Box>
                                <Button
                                    variant="outlined"
                                    startIcon={<AttachFile />}
                                    onClick={handleAttachDocument}
                                    size="small"
                                    sx={{
                                        textTransform: "none",
                                        alignSelf: "flex-start",
                                    }}
                                >
                                    Replace PDF
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onCancel} variant="outlined" size="small">
                    Cancel
                </Button>
                <Button onClick={handleSave} variant="contained" size="small">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FlowchartNode;
