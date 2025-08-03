import React, { useState } from "react";
import { IconButton, Popover, Box } from "@mui/material";
import { Delete, ColorLens } from "@mui/icons-material";

const Container = ({
    container,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    zoom,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(container.title);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });

    // Predefined color options
    const colorOptions = [
        { background: "#e8f5e8", border: "#4caf50", name: "Green" },
        { background: "#e3f2fd", border: "#2196f3", name: "Blue" },
        { background: "#fff3e0", border: "#ff9800", name: "Orange" },
        { background: "#fce4ec", border: "#e91e63", name: "Pink" },
        { background: "#f3e5f5", border: "#9c27b0", name: "Purple" },
        { background: "#fff9c4", border: "#ffeb3b", name: "Yellow" },
        { background: "#ffebee", border: "#f44336", name: "Red" },
        { background: "#f0f0f0", border: "#999999", name: "Gray" },
    ];

    const handleTitleDoubleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsEditing(true);
    };

    const handleTitleSubmit = () => {
        setIsEditing(false);
        if (title.trim() !== container.title) {
            onUpdate(container.id, { title: title.trim() || "Container" });
        }
    };

    const handleTitleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleTitleSubmit();
        } else if (e.key === "Escape") {
            setTitle(container.title);
            setIsEditing(false);
        }
    };

    const handleClick = (e) => {
        e.stopPropagation();
        console.log("Container selected:", container.id); // Keep this to verify selection works
        onSelect(container.id, e);
    };

    const handleColorSelect = (colorOption) => {
        onUpdate(container.id, {
            color: colorOption.background,
            borderColor: colorOption.border,
        });
        setColorPickerAnchor(null);
    };

    const handleColorPickerOpen = (e) => {
        e.stopPropagation();
        setColorPickerAnchor(e.currentTarget);
    };

    const handleColorPickerClose = () => {
        setColorPickerAnchor(null);
    };

    const handleMouseDown = (e) => {
        e.stopPropagation();
        onSelect(container.id, e);

        if (e.target.classList.contains("resize-handle")) {
            setIsResizing(true);
            setResizeStart({
                x: e.clientX,
                y: e.clientY,
                width: container.width,
                height: container.height,
            });
        } else {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - container.x * zoom,
                y: e.clientY - container.y * zoom,
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const gridSize = 20;
            const newX =
                Math.round((e.clientX - dragStart.x) / zoom / gridSize) *
                gridSize;
            const newY =
                Math.round((e.clientY - dragStart.y) / zoom / gridSize) *
                gridSize;

            onUpdate(container.id, { x: newX, y: newY });
        } else if (isResizing) {
            const gridSize = 20;
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;

            const newWidth = Math.max(
                80,
                Math.round((resizeStart.width + deltaX / zoom) / gridSize) *
                    gridSize
            );
            const newHeight = Math.max(
                60,
                Math.round((resizeStart.height + deltaY / zoom) / gridSize) *
                    gridSize
            );

            onUpdate(container.id, { width: newWidth, height: newHeight });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    React.useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, isResizing, dragStart, resizeStart]);

    const handleDelete = (e) => {
        if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            e.stopPropagation();
            onDelete(container.id);
        }
    };

    React.useEffect(() => {
        if (isSelected) {
            document.addEventListener("keydown", handleDelete);
            return () => {
                document.removeEventListener("keydown", handleDelete);
            };
        }
    }, [isSelected, container.id]);

    return (
        <div
            className="flowchart-container"
            style={{
                position: "absolute",
                left: container.x,
                top: container.y,
                width: container.width,
                height: container.height,
                backgroundColor: container.color || "#f0f0f0",
                border: `2px solid ${container.borderColor || "#999"}`,
                borderRadius: "8px",
                zIndex: isSelected ? 12 : 5, // Lower than connections (zIndex: 15)
                cursor: isDragging ? "grabbing" : "grab",
                opacity: isSelected ? 0.8 : 0.6,
                boxShadow: isSelected ? "0 0 10px rgba(0,0,0,0.3)" : "none",
                pointerEvents: "auto", // Ensure pointer events are enabled
            }}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
        >
            {/* Title */}
            <div
                style={{
                    position: "absolute",
                    top: "8px",
                    left: "12px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: container.borderColor || "#999",
                    backgroundColor: "white",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: `1px solid ${container.borderColor || "#999"}`,
                    cursor: isEditing ? "text" : "pointer",
                    minWidth: "60px",
                    boxShadow: isEditing
                        ? "0 0 0 2px rgba(76, 175, 80, 0.3)"
                        : "none",
                    transition: "box-shadow 0.2s ease",
                }}
                onDoubleClick={handleTitleDoubleClick}
                title={isEditing ? "" : "Double-click to edit title"}
            >
                {isEditing ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleSubmit}
                        onKeyDown={handleTitleKeyPress}
                        style={{
                            border: "none",
                            background: "none",
                            outline: "none",
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: container.borderColor || "#999",
                            width: "100%",
                            minWidth: "80px",
                        }}
                        autoFocus
                        onFocus={(e) => e.target.select()} // Select all text when focused
                    />
                ) : (
                    container.title
                )}
            </div>

            {/* Resize handle */}
            {isSelected && (
                <div
                    className="resize-handle"
                    style={{
                        position: "absolute",
                        bottom: "0px",
                        right: "0px",
                        width: "12px",
                        height: "12px",
                        backgroundColor: container.borderColor || "#999",
                        cursor: "se-resize",
                        borderRadius: "0 0 6px 0",
                    }}
                />
            )}

            {/* Color picker button */}
            {isSelected && !isEditing && (
                <>
                    <IconButton
                        size="small"
                        onClick={handleColorPickerOpen}
                        title="Change container color"
                        sx={{
                            position: "absolute",
                            top: -6,
                            right: 20, // Position next to delete button
                            width: 20,
                            height: 20,
                            backgroundColor: "white",
                            border: "1px solid #ddd",
                            "&:hover": {
                                backgroundColor: "#e0f7fa", // Light company color
                                borderColor: "#008093", // Company primary
                            },
                        }}
                    >
                        <ColorLens sx={{ fontSize: 14 }} color="primary" />
                    </IconButton>

                    <Popover
                        open={Boolean(colorPickerAnchor)}
                        anchorEl={colorPickerAnchor}
                        onClose={handleColorPickerClose}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "center",
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "center",
                        }}
                    >
                        <Box
                            sx={{
                                p: 1,
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: 1,
                            }}
                        >
                            {colorOptions.map((colorOption, index) => (
                                <Box
                                    key={index}
                                    onClick={() =>
                                        handleColorSelect(colorOption)
                                    }
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        backgroundColor: colorOption.background,
                                        border: `2px solid ${colorOption.border}`,
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        "&:hover": {
                                            transform: "scale(1.1)",
                                            boxShadow:
                                                "0 2px 8px rgba(0,0,0,0.2)",
                                        },
                                        transition: "all 0.2s ease",
                                    }}
                                    title={colorOption.name}
                                >
                                    {container.color ===
                                        colorOption.background && (
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                backgroundColor:
                                                    colorOption.border,
                                                borderRadius: "50%",
                                            }}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Popover>
                </>
            )}

            {/* Delete button */}
            {isSelected && (
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(container.id);
                    }}
                    title="Delete container"
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
        </div>
    );
};

export default Container;
