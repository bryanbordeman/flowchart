import React from "react";
import { Paper, Typography, Button, Box, Divider } from "@mui/material";
import { PlayArrow, CropSquare } from "@mui/icons-material";
import SegmentManager from "./SegmentManager";

// Custom icon components
const DiamondIcon = () => (
    <div
        style={{
            width: "16px",
            height: "16px",
            backgroundColor: "transparent",
            border: "2px solid currentColor",
            transform: "rotate(45deg)",
            display: "inline-block",
        }}
    />
);

const CircleIcon = () => (
    <div
        style={{
            width: "16px",
            height: "16px",
            backgroundColor: "transparent",
            border: "2px solid currentColor",
            borderRadius: "50%",
            display: "inline-block",
        }}
    />
);

const componentTypes = [
    { type: "start-end", label: "Start/End", icon: <PlayArrow /> },
    { type: "process", label: "Process", icon: <CropSquare /> },
    { type: "decision", label: "Decision", icon: <DiamondIcon /> },
    { type: "input-output", label: "Input/Output", icon: <CircleIcon /> },
];

const Sidebar = ({
    onAddNode,
    segments,
    onAddSegment,
    onDeleteSegment,
    onUpdateSegment,
}) => {
    const handleDragStart = (e, type) => {
        e.dataTransfer.setData("nodeType", type);
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleClick = (type) => {
        // Add node at a default position when clicked - snap to grid
        const gridSize = 20;

        // Generate a position that's more likely to be visible and not overlapping
        const baseX = 120; // Start further from the sidebar
        const baseY = 120;
        const offsetRange = 160; // Reduce range to keep nodes more centered

        const rawX = baseX + Math.random() * offsetRange;
        const rawY = baseY + Math.random() * offsetRange;

        // Snap to grid
        const snappedX = Math.round(rawX / gridSize) * gridSize;
        const snappedY = Math.round(rawY / gridSize) * gridSize;

        const position = {
            x: snappedX,
            y: snappedY,
        };
        onAddNode(type, position);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                width: 240,
                height: "100vh",
                maxHeight: "100vh",
                p: 2,
                borderRight: "1px solid #ddd",
                backgroundColor: "#f8f9fa",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Typography variant="h6" gutterBottom sx={{ mb: 2, flexShrink: 0 }}>
                Components
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    flexShrink: 0,
                }}
            >
                {componentTypes.map(({ type, label, icon }) => (
                    <Button
                        key={type}
                        variant="outlined"
                        startIcon={icon}
                        draggable
                        onDragStart={(e) => handleDragStart(e, type)}
                        onClick={() => handleClick(type)}
                        title={`Drag to canvas or click to add ${label}`}
                        sx={{
                            justifyContent: "flex-start",
                            textTransform: "none",
                            p: 1.5,
                            backgroundColor: "white",
                            "&:hover": {
                                backgroundColor: "#e9ecef",
                            },
                        }}
                    >
                        {label}
                    </Button>
                ))}
            </Box>

            <Box
                sx={{
                    mt: 2,
                    p: 1,
                    backgroundColor: "#f0f4f8",
                    borderRadius: 1,
                    flexShrink: 0,
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    💡 Tip: Drag components to the canvas or click to add at a
                    random position.
                </Typography>
            </Box>

            <Divider sx={{ my: 2, flexShrink: 0 }} />

            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <SegmentManager
                    segments={segments}
                    onAddSegment={onAddSegment}
                    onDeleteSegment={onDeleteSegment}
                    onUpdateSegment={onUpdateSegment}
                />
            </Box>
        </Paper>
    );
};

export default Sidebar;
