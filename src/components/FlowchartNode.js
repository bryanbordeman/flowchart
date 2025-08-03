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
    Menu,
    ListItemIcon,
    ListItemText,
    Divider,
} from "@mui/material";
import {
    AttachFile,
    Delete,
    Visibility,
    Close,
    Edit,
    PictureAsPdf,
    Description,
    TableChart,
    Image,
    InsertDriveFile,
    ExpandMore,
    Add,
    Architecture,
    Engineering,
    Folder,
    FolderOpen,
    Link,
} from "@mui/icons-material";
import autocadIcon from "../assets/autocad.svg";
import solidworksIcon from "../assets/solidworks.svg";
import pdfIcon from "../assets/pdf_icon.svg";
import docIcon from "../assets/doc_icon.svg";
import excelIcon from "../assets/xls_icon.svg";
import jpgIcon from "../assets/jpg_icon.svg";
import pngIcon from "../assets/png_icon.svg";

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
    const [editText, setEditText] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [documentMenuAnchor, setDocumentMenuAnchor] = useState(null);
    const [folderMenuAnchor, setFolderMenuAnchor] = useState(null);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });
    const inputRef = useRef(null);
    const nodeRef = useRef(null);

    const handleDoubleClick = () => {
        if (node.type !== "connector") {
            setIsEditing(true);
            setEditText(node.text);
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select(); // Select all text when editing starts
                }
            }, 0);
        }
    };

    const handleTextSubmit = () => {
        onUpdateText(node.id, editText);
        setIsEditing(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            // Ctrl+Enter or Cmd+Enter to submit
            e.preventDefault();
            handleTextSubmit();
        } else if (e.key === "Escape") {
            setEditText(node.text);
            setIsEditing(false);
        }
        // Allow normal Enter for new lines without preventing default
    };

    const handleDrag = (e, data) => {
        // Snap to grid (20px)
        const gridSize = 20;
        let snappedX = Math.round(data.x / gridSize) * gridSize;
        let snappedY = Math.round(data.y / gridSize) * gridSize;
        // Clamp so node cannot be moved left/up past origin
        snappedX = Math.max(0, snappedX);
        snappedY = Math.max(0, snappedY);

        onUpdatePosition(node.id, { x: snappedX, y: snappedY });
    };

    const handleClick = (e) => {
        e.stopPropagation();
        if (isConnecting && !isConnectingFrom) {
            // Complete connection to this node
            onCompleteConnection(node.id);
        } else {
            onSelect(node.id, e);
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

    // Resize handlers
    const handleResizeStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: node.width || getDefaultWidth(),
            height: node.height || getDefaultHeight(),
        });
    };

    const handleResizeMove = (e) => {
        if (!isResizing) return;

        const gridSize = 20;
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        // Calculate the original aspect ratio for this node type
        const originalWidth = getDefaultWidth();
        const originalHeight = getDefaultHeight();
        const aspectRatio = originalWidth / originalHeight;

        // Determine which dimension to use as the primary constraint
        // Use the larger change to determine scaling direction
        const useWidthAsBase = Math.abs(deltaX) >= Math.abs(deltaY);

        let newWidth, newHeight;

        if (useWidthAsBase) {
            // Scale based on width change
            newWidth = Math.max(
                getMinWidth(),
                Math.round((resizeStart.width + deltaX) / gridSize) * gridSize
            );
            newHeight = Math.max(
                getMinHeight(),
                Math.round(newWidth / aspectRatio / gridSize) * gridSize
            );
        } else {
            // Scale based on height change
            newHeight = Math.max(
                getMinHeight(),
                Math.round((resizeStart.height + deltaY) / gridSize) * gridSize
            );
            newWidth = Math.max(
                getMinWidth(),
                Math.round((newHeight * aspectRatio) / gridSize) * gridSize
            );
        }

        onUpdateNode(node.id, {
            ...node,
            width: newWidth,
            height: newHeight,
        });
    };

    const handleResizeEnd = () => {
        setIsResizing(false);
    };

    // Helper functions for node dimensions
    const getDefaultWidth = () => {
        return 120; // Default node width
    };

    const getDefaultHeight = () => {
        return node.type === "decision" ? 120 : 80; // Default heights
    };

    const getMinWidth = () => {
        return node.type === "decision" ? 80 : 80; // Minimum width - consistent for all types
    };

    const getMinHeight = () => {
        // Maintain aspect ratio for minimum sizes too
        const minWidth = getMinWidth();
        const originalWidth = getDefaultWidth();
        const originalHeight = getDefaultHeight();
        const aspectRatio = originalWidth / originalHeight;
        return Math.round(minWidth / aspectRatio);
    };

    const getCurrentWidth = () => {
        return node.width || getDefaultWidth();
    };

    const getCurrentHeight = () => {
        return node.height || getDefaultHeight();
    };

    // Get dynamic port positions based on current node dimensions
    const getPortStyles = () => {
        const width = getCurrentWidth();
        const height = getCurrentHeight();
        const portSize = 12; // Port width/height
        const offset = 6; // Half of port size for centering

        // For decision nodes (diamond shape), ports are positioned at the diamond tips
        if (node.type === "decision") {
            return {
                top: {
                    top: -offset,
                    left: width / 2 - offset,
                },
                right: {
                    right: -offset,
                    top: height / 2 - offset,
                },
                bottom: {
                    bottom: -offset,
                    left: width / 2 - offset,
                },
                left: {
                    left: -offset,
                    top: height / 2 - offset,
                },
            };
        }

        // For all other node types (rectangular, input-output ellipse, etc.)
        return {
            top: {
                top: -offset,
                left: width / 2 - offset,
            },
            right: {
                right: -offset,
                top: height / 2 - offset,
            },
            bottom: {
                bottom: -offset,
                left: width / 2 - offset,
            },
            left: {
                left: -offset,
                top: height / 2 - offset,
            },
        };
    };

    // Add event listeners for resize
    React.useEffect(() => {
        if (isResizing) {
            document.addEventListener("mousemove", handleResizeMove);
            document.addEventListener("mouseup", handleResizeEnd);

            return () => {
                document.removeEventListener("mousemove", handleResizeMove);
                document.removeEventListener("mouseup", handleResizeEnd);
            };
        }
    }, [isResizing, resizeStart]);

    const handleSaveEdit = (
        newText,
        newSegment,
        newDocument,
        newDocuments,
        newFolderLinks
    ) => {
        onUpdateNode(node.id, {
            text: newText,
            segment: newSegment,
            document: newDocument, // Keep for backward compatibility
            documents: newDocuments || [], // New multi-document support
            folderLinks: newFolderLinks || [], // New folder links support
        });
        setShowEditModal(false);
    };

    const handleCancelEdit = () => {
        setShowEditModal(false);
    };

    const handleDocumentClick = async (e) => {
        e.stopPropagation();

        const allDocuments = [...(node.documents || [])];
        // Add legacy document if it exists and isn't already in documents
        if (
            node.document &&
            !allDocuments.find((doc) => doc.id === node.document.id)
        ) {
            allDocuments.unshift(node.document);
        }

        if (allDocuments.length === 0) return;

        if (allDocuments.length === 1) {
            // Single document - open directly
            try {
                const result = await window.electronAPI.openDocument(
                    allDocuments[0]
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
        } else {
            // Multiple documents - show dropdown menu
            setDocumentMenuAnchor(e.currentTarget);
        }
    };

    const handleDocumentMenuClose = () => {
        setDocumentMenuAnchor(null);
    };

    const handleDocumentMenuItemClick = async (document) => {
        setDocumentMenuAnchor(null);
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

    // Folder link handlers
    const handleFolderClick = async (e) => {
        e.stopPropagation();

        const allFolders = [...(node.folderLinks || [])];

        if (allFolders.length === 0) return;

        if (allFolders.length === 1) {
            // Single folder - open directly
            try {
                const result = await window.electronAPI.openFolder(
                    allFolders[0]
                );
                if (!result.success) {
                    alert(
                        "Failed to open folder: " +
                            (result.error || "Unknown error")
                    );
                }
            } catch (error) {
                console.error("Error opening folder:", error);
                alert("Failed to open folder");
            }
        } else {
            // Multiple folders - show dropdown menu
            setFolderMenuAnchor(e.currentTarget);
        }
    };

    const handleFolderMenuClose = () => {
        setFolderMenuAnchor(null);
    };

    const handleFolderMenuItemClick = async (folder) => {
        setFolderMenuAnchor(null);
        try {
            const result = await window.electronAPI.openFolder(folder);
            if (!result.success) {
                alert(
                    "Failed to open folder: " +
                        (result.error || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Error opening folder:", error);
            alert("Failed to open folder");
        }
    };

    const getFileIcon = (fileType) => {
        // console.log("Main getFileIcon called with fileType:", fileType); // Debug log
        switch (fileType) {
            case "pdf":
                return (
                    <img
                        src={pdfIcon}
                        alt="PDF"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "word":
                return (
                    <img
                        src={docIcon}
                        alt="Word Document"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "excel":
                return (
                    <img
                        src={excelIcon}
                        alt="Excel"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "png":
                return (
                    <img
                        src={pngIcon}
                        alt="PNG Image"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "jpeg":
            case "jpg":
                return (
                    <img
                        src={jpgIcon}
                        alt="JPEG Image"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "image":
                return (
                    <img
                        src={jpgIcon}
                        alt="Image"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "autocad":
                return (
                    <img
                        src={autocadIcon}
                        alt="AutoCAD"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "solidworks":
                return (
                    <img
                        src={solidworksIcon}
                        alt="SolidWorks"
                        style={{ width: 24, height: 24 }}
                    />
                );
            default:
                return <InsertDriveFile color="action" />;
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
                    style={{
                        width: getCurrentWidth(),
                        height: getCurrentHeight(),
                        ...(node.type === "decision"
                            ? { "--diamond-color": getSegmentColor() }
                            : { backgroundColor: getSegmentColor() }),
                    }}
                    onClick={handleClick}
                    onContextMenu={handleRightClick}
                    onDoubleClick={handleDoubleClick}
                    title={
                        isConnecting && !isConnectingFrom
                            ? "Click connection port to connect here"
                            : "Drag from connection ports to create connections"
                    }
                >
                    {/* Delete button - only show when selected */}
                    {isSelected && (
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
                    )}

                    {/* Edit button - only show when selected */}
                    {isSelected && (
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
                    )}

                    {/* Resize handle - only show when selected */}
                    {isSelected && (
                        <div
                            onMouseDown={handleResizeStart}
                            title="Drag to resize"
                            style={{
                                position: "absolute",
                                bottom: -3,
                                right: -3,
                                width: 12,
                                height: 12,
                                backgroundColor: "white",
                                border: "2px solid #2196f3",
                                borderRadius: "50%",
                                cursor: "nw-resize",
                                zIndex: 1000,
                                "&:hover": {
                                    backgroundColor: "#e3f2fd",
                                },
                            }}
                        />
                    )}

                    {/* Connection Ports */}
                    {node.type !== "connector" && (
                        <>
                            {/* Top Port */}
                            <div
                                className="connection-port port-top"
                                style={getPortStyles().top}
                                onClick={(e) => handlePortClick(e, "top")}
                                onMouseDown={(e) =>
                                    handlePortMouseDown(e, "top")
                                }
                                title="Drag to connect"
                            />
                            {/* Right Port */}
                            <div
                                className="connection-port port-right"
                                style={getPortStyles().right}
                                onClick={(e) => handlePortClick(e, "right")}
                                onMouseDown={(e) =>
                                    handlePortMouseDown(e, "right")
                                }
                                title="Drag to connect"
                            />
                            {/* Bottom Port */}
                            <div
                                className="connection-port port-bottom"
                                style={getPortStyles().bottom}
                                onClick={(e) => handlePortClick(e, "bottom")}
                                onMouseDown={(e) =>
                                    handlePortMouseDown(e, "bottom")
                                }
                                title="Drag to connect"
                            />
                            {/* Left Port */}
                            <div
                                className="connection-port port-left"
                                style={getPortStyles().left}
                                onClick={(e) => handlePortClick(e, "left")}
                                onMouseDown={(e) =>
                                    handlePortMouseDown(e, "left")
                                }
                                title="Drag to connect"
                            />
                        </>
                    )}

                    {/* Document indicator - positioned outside component like edit/delete buttons */}
                    {((node.documents && node.documents.length > 0) ||
                        node.document) && (
                        <>
                            <IconButton
                                size="small"
                                onClick={handleDocumentClick}
                                title={
                                    node.documents && node.documents.length > 1
                                        ? `${node.documents.length} documents attached`
                                        : `Click to open: ${
                                              (node.documents &&
                                                  node.documents[0]
                                                      ?.fileName) ||
                                              node.document?.fileName
                                          }`
                                }
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
                                {/* Show multiple documents indicator */}
                                {node.documents &&
                                    node.documents.length > 1 && (
                                        <ExpandMore
                                            sx={{
                                                fontSize: 8,
                                                position: "absolute",
                                                bottom: -2,
                                                right: -2,
                                                backgroundColor:
                                                    "secondary.main",
                                                color: "white",
                                                borderRadius: "50%",
                                                width: 10,
                                                height: 10,
                                            }}
                                        />
                                    )}
                            </IconButton>
                        </>
                    )}

                    {/* Folder links indicator - positioned outside component like edit/delete buttons */}
                    {node.folderLinks && node.folderLinks.length > 0 && (
                        <>
                            <IconButton
                                size="small"
                                onClick={handleFolderClick}
                                title={
                                    node.folderLinks.length > 1
                                        ? `${node.folderLinks.length} folders linked`
                                        : `Click to open: ${node.folderLinks[0]?.name}`
                                }
                                sx={{
                                    position: "absolute",
                                    bottom: -6,
                                    left:
                                        (node.documents &&
                                            node.documents.length > 0) ||
                                        node.document
                                            ? 16
                                            : -6,
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
                                <Folder sx={{ fontSize: 14 }} color="primary" />
                                {/* Show multiple folders indicator */}
                                {node.folderLinks.length > 1 && (
                                    <ExpandMore
                                        sx={{
                                            fontSize: 8,
                                            position: "absolute",
                                            bottom: -2,
                                            right: -2,
                                            backgroundColor: "primary.main",
                                            color: "white",
                                            borderRadius: "50%",
                                            width: 10,
                                            height: 10,
                                        }}
                                    />
                                )}
                            </IconButton>
                        </>
                    )}

                    <div className="node-content">
                        {isEditing ? (
                            <textarea
                                ref={inputRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onBlur={handleTextSubmit}
                                onKeyDown={handleKeyPress}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    textAlign: "center",
                                    width: "100%",
                                    height: "100%",
                                    fontSize: "12px",
                                    fontFamily: "inherit",
                                    resize: "none",
                                    outline: "none",
                                    overflow: "hidden",
                                    padding:
                                        "2px" /* Reduced padding to match text area */,
                                    boxSizing: "border-box",
                                    wordBreak: "break-all",
                                    wordWrap: "break-word",
                                    overflowWrap: "anywhere",
                                }}
                                placeholder="Enter text (Ctrl+Enter to save, Esc to cancel)"
                            />
                        ) : (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                    lineHeight: "1.2",
                                    wordBreak: "break-all",
                                    wordWrap: "break-word",
                                    overflowWrap: "anywhere",
                                    hyphens: "auto",
                                    textAlign: "center",
                                    whiteSpace: "pre-wrap", // Preserve line breaks and spaces
                                }}
                            >
                                {node.text}
                            </div>
                        )}
                    </div>
                </div>
            </Draggable>

            {/* Document selection menu - rendered outside Draggable */}
            <Menu
                anchorEl={documentMenuAnchor}
                open={Boolean(documentMenuAnchor)}
                onClose={handleDocumentMenuClose}
                PaperProps={{
                    sx: { maxWidth: 300, maxHeight: 300 },
                }}
            >
                {node.documents &&
                    node.documents.map((doc, index) => (
                        <MenuItem
                            key={doc.id}
                            onClick={() => handleDocumentMenuItemClick(doc)}
                            sx={{ py: 1 }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                {getFileIcon(doc.fileType)}
                            </ListItemIcon>
                            <ListItemText
                                primary={doc.fileName}
                                secondary={`${doc.fileType.toUpperCase()} • ${formatFileSize(
                                    doc.fileSize
                                )}`}
                                sx={{
                                    "& .MuiListItemText-primary": {
                                        fontSize: "0.875rem",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    },
                                    "& .MuiListItemText-secondary": {
                                        fontSize: "0.75rem",
                                    },
                                }}
                            />
                        </MenuItem>
                    ))}
                {/* Show legacy document if it exists */}
                {node.document &&
                    (!node.documents ||
                        !node.documents.find(
                            (doc) => doc.id === node.document.id
                        )) && (
                        <>
                            {node.documents && node.documents.length > 0 && (
                                <Divider />
                            )}
                            <MenuItem
                                onClick={() =>
                                    handleDocumentMenuItemClick(node.document)
                                }
                                sx={{ py: 1 }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <PictureAsPdf color="error" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={node.document.fileName}
                                    secondary="Legacy Document"
                                    sx={{
                                        "& .MuiListItemText-primary": {
                                            fontSize: "0.875rem",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        },
                                        "& .MuiListItemText-secondary": {
                                            fontSize: "0.75rem",
                                        },
                                    }}
                                />
                            </MenuItem>
                        </>
                    )}
            </Menu>

            {/* Folder selection menu - rendered outside Draggable */}
            <Menu
                anchorEl={folderMenuAnchor}
                open={Boolean(folderMenuAnchor)}
                onClose={handleFolderMenuClose}
                PaperProps={{
                    sx: { maxWidth: 300, maxHeight: 300 },
                }}
            >
                {node.folderLinks &&
                    node.folderLinks.map((folder, index) => (
                        <MenuItem
                            key={folder.id}
                            onClick={() => handleFolderMenuItemClick(folder)}
                            sx={{ py: 1 }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <Folder color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary={folder.name}
                                secondary={folder.path}
                                sx={{
                                    "& .MuiListItemText-primary": {
                                        fontSize: "0.875rem",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    },
                                    "& .MuiListItemText-secondary": {
                                        fontSize: "0.75rem",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    },
                                }}
                            />
                        </MenuItem>
                    ))}
            </Menu>

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

    // Initialize documents with migration from legacy single document
    const [documents, setDocuments] = useState(() => {
        const docs = node.documents || [];
        // If there's a legacy document that's not already in the documents array, add it
        if (node.document && !docs.find((doc) => doc.id === node.document.id)) {
            return [node.document, ...docs];
        }
        return docs;
    });

    // Initialize folder links
    const [folderLinks, setFolderLinks] = useState(node.folderLinks || []);

    const [documentMenuAnchor, setDocumentMenuAnchor] = useState(null);

    const handleSave = () => {
        // Maintain backward compatibility by setting document property for legacy support
        const primaryDocument = documents.length > 0 ? documents[0] : null;
        onSave(text, segment, primaryDocument, documents, folderLinks);
    };

    const handleAttachDocument = async () => {
        try {
            console.log("Starting document attachment...");
            const result = await window.electronAPI.attachDocument();
            console.log("Attachment result:", result);

            if (
                result.success &&
                result.documents &&
                result.documents.length > 0
            ) {
                console.log(
                    "Successfully attached documents:",
                    result.documents
                );
                // Add new documents to the existing list
                setDocuments((prev) => [...prev, ...result.documents]);
                // For backward compatibility, also set the first document as the primary document
                if (documents.length === 0) {
                    setDocument(result.documents[0]);
                }
            } else {
                console.error("Attachment failed:", result);
                alert(
                    "Failed to attach document(s): " +
                        (result.error || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Error attaching document:", error);
            alert("Failed to attach document(s): " + error.message);
        }
    };

    const handleViewDocument = async (documentToView = null) => {
        const docToOpen =
            documentToView || (documents.length > 0 ? documents[0] : document);
        if (!docToOpen) return;

        try {
            const result = await window.electronAPI.openDocument(docToOpen);
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

    const handleRemoveDocument = (documentId = null) => {
        if (documentId) {
            // Remove specific document from the list
            setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
            // If removing the primary document, clear it and set a new one if available
            if (document && document.id === documentId) {
                const remainingDocs = documents.filter(
                    (doc) => doc.id !== documentId
                );
                setDocument(remainingDocs.length > 0 ? remainingDocs[0] : null);
            }
        } else {
            // Remove all documents (legacy support)
            setDocuments([]);
            setDocument(null);
        }
    };

    // Folder link handlers
    const handleAttachFolder = async () => {
        try {
            console.log("Starting folder attachment...");
            const result = await window.electronAPI.attachFolder();
            console.log("Folder attachment result:", result);

            if (result.success && result.folder) {
                console.log("Successfully attached folder:", result.folder);
                // Add new folder to the existing list
                setFolderLinks((prev) => [...prev, result.folder]);
            } else {
                console.error("Folder attachment failed:", result);
                alert(
                    "Failed to attach folder: " +
                        (result.error || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Error attaching folder:", error);
            alert("Failed to attach folder: " + error.message);
        }
    };

    const handleRemoveFolder = (folderId) => {
        setFolderLinks((prev) =>
            prev.filter((folder) => folder.id !== folderId)
        );
    };

    const getFileIcon = (fileType) => {
        console.log(
            "EditNodeModal getFileIcon called with fileType:",
            fileType
        ); // Debug log
        switch (fileType) {
            case "pdf":
                return (
                    <img
                        src={pdfIcon}
                        alt="PDF"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "word":
                return (
                    <img
                        src={docIcon}
                        alt="Word Document"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "excel":
                return (
                    <img
                        src={excelIcon}
                        alt="Excel"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "png":
                return (
                    <img
                        src={pngIcon}
                        alt="PNG Image"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "jpeg":
            case "jpg":
                return (
                    <img
                        src={jpgIcon}
                        alt="JPEG Image"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "image":
                return (
                    <img
                        src={jpgIcon}
                        alt="Image"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "autocad":
                return (
                    <img
                        src={autocadIcon}
                        alt="AutoCAD"
                        style={{ width: 24, height: 24 }}
                    />
                );
            case "solidworks":
                return (
                    <img
                        src={solidworksIcon}
                        alt="SolidWorks"
                        style={{ width: 24, height: 24 }}
                    />
                );
            default:
                return <InsertDriveFile color="action" />;
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleDocumentMenuOpen = (event) => {
        setDocumentMenuAnchor(event.currentTarget);
    };

    const handleDocumentMenuClose = () => {
        setDocumentMenuAnchor(null);
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
                Edit Node
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

                    {/* Document Attachments */}
                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Documents:
                        </Typography>

                        {/* Attach Documents Button */}
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={handleAttachDocument}
                            size="small"
                            sx={{ textTransform: "none", mb: 2 }}
                        >
                            Attach Files
                        </Button>

                        {/* Display attached documents */}
                        {documents.length > 0 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                }}
                            >
                                {documents.map((doc, index) => (
                                    <Box
                                        key={doc.id}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            p: 1,
                                            border: "1px solid #e0e0e0",
                                            borderRadius: 1,
                                            backgroundColor: "#fafafa",
                                        }}
                                    >
                                        {getFileIcon(doc.fileType)}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" noWrap>
                                                {doc.fileName}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {doc.fileType.toUpperCase()} •{" "}
                                                {formatFileSize(doc.fileSize)}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleViewDocument(doc)
                                            }
                                            sx={{ color: "primary.main" }}
                                        >
                                            <Visibility />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleRemoveDocument(doc.id)
                                            }
                                            sx={{ color: "error.main" }}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Legacy single document support - hide if we have multiple documents */}
                        {documents.length === 0 && document && (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                }}
                            >
                                <Chip
                                    label={document.fileName}
                                    icon={<Visibility />}
                                    onClick={() => handleViewDocument(document)}
                                    onDelete={() => handleRemoveDocument()}
                                    deleteIcon={<Delete />}
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    sx={{
                                        maxWidth: "300px",
                                        alignSelf: "flex-start",
                                    }}
                                />
                            </Box>
                        )}

                        {documents.length === 0 && !document && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontStyle: "italic" }}
                            >
                                No documents attached
                            </Typography>
                        )}
                    </Box>

                    {/* Folder Links */}
                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Folder Links:
                        </Typography>

                        {/* Attach Folder Button */}
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={handleAttachFolder}
                            size="small"
                            sx={{ textTransform: "none", mb: 2 }}
                        >
                            Add Folder Link
                        </Button>

                        {/* Display linked folders */}
                        {folderLinks.length > 0 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                }}
                            >
                                {folderLinks.map((folder, index) => (
                                    <Box
                                        key={folder.id}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            p: 1,
                                            border: "1px solid #e0e0e0",
                                            borderRadius: 1,
                                            backgroundColor: "#fafafa",
                                        }}
                                    >
                                        <Folder color="primary" />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" noWrap>
                                                {folder.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    display: "block",
                                                }}
                                            >
                                                {folder.path}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleRemoveFolder(folder.id)
                                            }
                                            sx={{ color: "error.main" }}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {folderLinks.length === 0 && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontStyle: "italic" }}
                            >
                                No folders linked
                            </Typography>
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
