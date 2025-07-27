import React, { useState, useRef } from "react";
import Draggable from "react-draggable";

const FlowchartNode = ({
    node,
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

    const handleSaveEdit = (newText, newColor) => {
        onUpdateNode(node.id, { text: newText, color: newColor });
        setShowEditModal(false);
    };

    const handleCancelEdit = () => {
        setShowEditModal(false);
    };

    // Dynamic styling based on connection state
    const getNodeClassName = () => {
        let className = `flowchart-node ${node.type}`;

        // Add color class
        const nodeColor = node.color || "default";
        className += ` color-${nodeColor}`;

        if (isSelected) className += " selected";
        if (isConnectingFrom) className += " connecting-from";
        if (isConnecting && !isConnectingFrom)
            className += " connection-target";
        return className;
    };

    return (
        <>
            <Draggable
                position={node.position}
                onDrag={handleDrag}
                handle=".node-content"
                grid={[20, 20]} // Grid snapping in Draggable
                disabled={isConnecting}
            >
                <div
                    className={getNodeClassName()}
                    onClick={handleClick}
                    onContextMenu={handleRightClick}
                    onDoubleClick={handleDoubleClick}
                    title={
                        isConnecting && !isConnectingFrom
                            ? "Click connection port to connect here"
                            : "Drag from connection ports to create connections"
                    }
                >
                    <button
                        className="delete-button"
                        onClick={handleDelete}
                        title="Delete node"
                    >
                        ×
                    </button>

                    <button
                        className="edit-button"
                        onClick={handleEditModal}
                        title="Edit node properties"
                    >
                        ✎
                    </button>

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
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                />
            )}
        </>
    );
};

// Edit Node Modal Component
const EditNodeModal = ({ node, onSave, onCancel }) => {
    const [text, setText] = useState(node.text);
    const [color, setColor] = useState(node.color || "default");

    const colorOptions = [
        { name: "Default", value: "default", bg: "#87ceeb", border: "#4682b4" },
        { name: "Red", value: "red", bg: "#ffb3b3", border: "#ff6b6b" },
        { name: "Green", value: "green", bg: "#b3ffb3", border: "#6bff6b" },
        { name: "Blue", value: "blue", bg: "#b3d9ff", border: "#4da6ff" },
        { name: "Yellow", value: "yellow", bg: "#ffffb3", border: "#ffff4d" },
        { name: "Purple", value: "purple", bg: "#e0b3ff", border: "#cc66ff" },
        { name: "Orange", value: "orange", bg: "#ffcc99", border: "#ff9933" },
        { name: "Pink", value: "pink", bg: "#ffccdd", border: "#ff99bb" },
    ];

    const handleSave = () => {
        onSave(text, color);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            onCancel();
        }
    };

    return (
        <div className="edit-modal-overlay" onClick={onCancel}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Edit Node</h3>

                <div className="edit-field">
                    <label>Text:</label>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        autoFocus
                    />
                </div>

                <div className="edit-field">
                    <label>Color:</label>
                    <div className="color-options">
                        {colorOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`color-option ${
                                    color === option.value ? "selected" : ""
                                }`}
                                style={{
                                    backgroundColor: option.bg,
                                    border: `2px solid ${option.border}`,
                                }}
                                onClick={() => setColor(option.value)}
                                title={option.name}
                            >
                                {color === option.value && <span>✓</span>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="edit-buttons">
                    <button className="save-btn" onClick={handleSave}>
                        Save
                    </button>
                    <button className="cancel-btn" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlowchartNode;
