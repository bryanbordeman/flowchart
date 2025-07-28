import React, { useState } from "react";
import { ChromePicker } from "react-color";
import {
    Box,
    Typography,
    Button,
    TextField,
    IconButton,
    Paper,
    Dialog,
    DialogContent,
    Chip,
    Stack,
    Grid,
} from "@mui/material";
import { Add, Delete, Edit, Palette } from "@mui/icons-material";

// Predefined pastel colors
const pastelColors = [
    "#C8E6C9", // Light green
    "#BBDEFB", // Light blue
    "#FFF9C4", // Light yellow
    "#FFCC80", // Light orange
    "#E1BEE7", // Light purple
    "#FFCDD2", // Light pink
    "#B2EBF2", // Light cyan
    "#D7CCC8", // Light brown
];

const SegmentManager = ({
    segments,
    onAddSegment,
    onDeleteSegment,
    onUpdateSegment,
}) => {
    const [showColorPicker, setShowColorPicker] = useState(null);
    const [newSegmentName, setNewSegmentName] = useState("");
    const [isAddingSegment, setIsAddingSegment] = useState(false);

    // Function to get a random pastel color
    const getRandomPastelColor = () => {
        return pastelColors[Math.floor(Math.random() * pastelColors.length)];
    };

    const handleAddSegment = () => {
        if (newSegmentName.trim()) {
            onAddSegment({
                id: Date.now().toString(),
                name: newSegmentName.trim(),
                color: getRandomPastelColor(), // Use random pastel color
            });
            setNewSegmentName("");
            setIsAddingSegment(false);
        }
    };

    const handleColorChange = (segmentId, color) => {
        onUpdateSegment(segmentId, { color: color.hex });
    };

    const handleNameChange = (segmentId, newName) => {
        if (newName.trim()) {
            onUpdateSegment(segmentId, { name: newName.trim() });
        }
    };

    return (
        <Box>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <Typography variant="h6">Segments</Typography>
                <IconButton
                    size="small"
                    onClick={() => setIsAddingSegment(true)}
                    title="Add new segment"
                    color="primary"
                >
                    <Add />
                </IconButton>
            </Box>

            {isAddingSegment && (
                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        value={newSegmentName}
                        onChange={(e) => setNewSegmentName(e.target.value)}
                        placeholder="Segment name"
                        autoFocus
                        onKeyPress={(e) => {
                            if (e.key === "Enter") {
                                handleAddSegment();
                            } else if (e.key === "Escape") {
                                setIsAddingSegment(false);
                                setNewSegmentName("");
                            }
                        }}
                        sx={{ mb: 1 }}
                    />
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "flex-end",
                        }}
                    >
                        <Button
                            size="small"
                            variant="contained"
                            onClick={handleAddSegment}
                        >
                            Add
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                                setIsAddingSegment(false);
                                setNewSegmentName("");
                            }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Paper>
            )}

            <Stack spacing={1} sx={{ maxHeight: 300, overflowY: "auto" }}>
                {segments.map((segment) => (
                    <Paper key={segment.id} elevation={1} sx={{ p: 1.5 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    backgroundColor: segment.color,
                                    border: "2px solid #ddd",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                    "&:hover": {
                                        borderColor: "primary.main",
                                    },
                                }}
                                onClick={() =>
                                    setShowColorPicker(
                                        showColorPicker === segment.id
                                            ? null
                                            : segment.id
                                    )
                                }
                                title="Click to change color"
                            />
                            <TextField
                                fullWidth
                                size="small"
                                value={segment.name}
                                onChange={(e) =>
                                    handleNameChange(segment.id, e.target.value)
                                }
                                variant="standard"
                                onBlur={(e) => {
                                    if (!e.target.value.trim()) {
                                        // Reset to original name if empty
                                        e.target.value = segment.name;
                                    }
                                }}
                            />
                            <IconButton
                                size="small"
                                onClick={() => onDeleteSegment(segment.id)}
                                title="Delete segment"
                                color="error"
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Box>

                        <Dialog
                            open={showColorPicker === segment.id}
                            onClose={() => setShowColorPicker(null)}
                            maxWidth="sm"
                        >
                            <DialogContent>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Choose Color
                                    </Typography>

                                    {/* Pastel Color Presets */}
                                    <Typography
                                        variant="subtitle2"
                                        gutterBottom
                                    >
                                        Pastel Colors:
                                    </Typography>
                                    <Grid container spacing={1} sx={{ mb: 3 }}>
                                        {pastelColors.map((color, index) => (
                                            <Grid item key={index}>
                                                <Box
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        backgroundColor: color,
                                                        border:
                                                            segment.color ===
                                                            color
                                                                ? "3px solid #1976d2"
                                                                : "2px solid #ddd",
                                                        borderRadius: 1,
                                                        cursor: "pointer",
                                                        "&:hover": {
                                                            borderColor:
                                                                "#1976d2",
                                                        },
                                                    }}
                                                    onClick={() =>
                                                        handleColorChange(
                                                            segment.id,
                                                            { hex: color }
                                                        )
                                                    }
                                                    title={`Pastel color ${
                                                        index + 1
                                                    }`}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {/* Custom Color Picker */}
                                    <Typography
                                        variant="subtitle2"
                                        gutterBottom
                                    >
                                        Custom Color:
                                    </Typography>
                                </Box>

                                <ChromePicker
                                    color={segment.color}
                                    onChange={(color) =>
                                        handleColorChange(segment.id, color)
                                    }
                                    disableAlpha={true}
                                />
                                <Box
                                    sx={{
                                        mt: 2,
                                        display: "flex",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => setShowColorPicker(null)}
                                    >
                                        Done
                                    </Button>
                                </Box>
                            </DialogContent>
                        </Dialog>
                    </Paper>
                ))}
            </Stack>

            {segments.length === 0 && !isAddingSegment && (
                <Box
                    sx={{ textAlign: "center", py: 3, color: "text.secondary" }}
                >
                    <Typography variant="body2">
                        No segments created yet.
                    </Typography>
                    <Typography variant="caption">
                        Click + to add your first segment.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default SegmentManager;
