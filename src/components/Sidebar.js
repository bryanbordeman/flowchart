import React from "react";
import { Paper, Typography, Button, Box, Divider } from "@mui/material";
import { PlayArrow, CropSquare, BorderOuter } from "@mui/icons-material";
import SegmentManager from "./SegmentManager";

import { Avatar } from "@mui/material";

// Custom SVG icon components (all use the same color)
const ICON_COLOR = "#008093"; // Company primary color
const DISABLED_COLOR = "rgba(0, 0, 0, 0.26)"; // Material-UI disabled color

const DiamondIcon = ({ color = ICON_COLOR }) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
            x="5"
            y="5"
            width="10"
            height="10"
            stroke={color}
            strokeWidth="2"
            transform="rotate(45 10 10)"
            fill="none"
        />
    </svg>
);

const CircleIcon = ({ color = ICON_COLOR }) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle
            cx="10"
            cy="10"
            r="8"
            stroke={color}
            strokeWidth="2"
            fill="none"
        />
    </svg>
);

const componentTypes = [
    {
        type: "start-end",
        label: "Start/End",
        icon: <PlayArrow sx={{ color: ICON_COLOR, fontSize: 20 }} />,
    },
    {
        type: "process",
        label: "Process",
        icon: <CropSquare sx={{ color: ICON_COLOR, fontSize: 20 }} />,
    },
    {
        type: "decision",
        label: "Decision",
        icon: <DiamondIcon />,
    },
    {
        type: "input-output",
        label: "Input/Output",
        icon: <CircleIcon />,
    },
];

const Sidebar = ({
    onAddNode,
    segments,
    onAddSegment,
    onDeleteSegment,
    onUpdateSegment,
    isDrawingContainer,
    onToggleDrawingContainer,
    isLocked,
}) => {
    const handleDragStart = (e, type) => {
        if (isLocked) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("nodeType", type);
        e.dataTransfer.effectAllowed = "copy";
    };

    // On click, add node at center of visible canvas
    const handleClick = (type) => {
        if (isLocked) return; // Prevent adding nodes when locked
        if (onAddNode) {
            // Default position: center of viewport
            const centerX = window.innerWidth / 2 - 60; // Center for 120px node
            const centerY = window.innerHeight / 2 - 40; // Center for 80px node
            onAddNode(type, { x: centerX, y: centerY });
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                width: 260,
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
            <Typography
                variant="h6"
                gutterBottom
                sx={{
                    mb: 1,
                    pb: 1,
                    fontSize: 16,
                    flexShrink: 0,
                    borderBottom: "1px solid #008093",
                }}
            >
                Components
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    flexShrink: 0,
                }}
            >
                {componentTypes.map(({ type, label, icon }) => {
                    // Determine icon color based on locked state
                    const iconColor = isLocked ? DISABLED_COLOR : ICON_COLOR;

                    // Render icon with appropriate color
                    let renderedIcon;
                    if (type === "decision") {
                        renderedIcon = <DiamondIcon color={iconColor} />;
                    } else if (type === "input-output") {
                        renderedIcon = <CircleIcon color={iconColor} />;
                    } else {
                        // For Material-UI icons, clone and add color
                        renderedIcon = React.cloneElement(icon, {
                            sx: {
                                ...icon.props.sx,
                                color: iconColor,
                                fontSize: 20,
                            },
                        });
                    }

                    return (
                        <Button
                            key={type}
                            variant="outlined"
                            disabled={isLocked}
                            startIcon={
                                <Box
                                    sx={{
                                        minWidth: 24,
                                        maxWidth: 24,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 1,
                                    }}
                                >
                                    {renderedIcon}
                                </Box>
                            }
                            draggable={!isLocked}
                            onDragStart={(e) => handleDragStart(e, type)}
                            onClick={() => handleClick(type)}
                            title={isLocked ? "Canvas is locked" : label}
                            sx={{
                                justifyContent: "flex-start",
                                textTransform: "none",
                                minHeight: 40,
                                fontSize: 15,
                                pl: 1.5,
                                pr: 1,
                                backgroundColor: "white",
                                alignItems: "center",
                                textAlign: "left",
                                "& .MuiButton-startIcon": {
                                    marginLeft: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                },
                                "&:hover": {
                                    backgroundColor: "#e9ecef",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    flexGrow: 1,
                                    textAlign: "left",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {label}
                            </Box>
                        </Button>
                    );
                })}
            </Box>

            {/* Container Drawing Section */}
            <Divider sx={{ my: 2 }} />
            <Typography
                variant="h6"
                gutterBottom
                sx={{
                    mb: 1,
                    pb: 1,
                    fontSize: 16,
                    flexShrink: 0,
                    borderBottom: "1px solid #008093",
                }}
            >
                Containers
            </Typography>
            <Button
                variant={isDrawingContainer ? "contained" : "outlined"}
                disabled={isLocked}
                startIcon={<BorderOuter />}
                onClick={onToggleDrawingContainer}
                title={
                    isLocked
                        ? "Canvas is locked"
                        : isDrawingContainer
                        ? "Stop Drawing Container"
                        : "Draw Container"
                }
                sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    minHeight: 40,
                    fontSize: 15,
                    pl: 1.5,
                    pr: 1,
                    backgroundColor: isDrawingContainer ? "#008093" : "white",
                    color: isDrawingContainer ? "white" : "#008093",
                    alignItems: "center",
                    textAlign: "left",
                    "&:hover": {
                        backgroundColor: isDrawingContainer
                            ? "#1565c0"
                            : "#e9ecef",
                    },
                }}
            >
                <Box
                    sx={{
                        flexGrow: 1,
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {isDrawingContainer
                        ? "Drawing Container..."
                        : "Draw Container"}
                </Box>
            </Button>

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    mt: 2,
                }}
            >
                <SegmentManager
                    segments={segments}
                    onAddSegment={onAddSegment}
                    onDeleteSegment={onDeleteSegment}
                    onUpdateSegment={onUpdateSegment}
                    isLocked={isLocked}
                />
            </Box>
        </Paper>
    );
};

export default Sidebar;
