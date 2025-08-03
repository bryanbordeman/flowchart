import React, { useState, useRef, useEffect } from "react";
import {
    Button,
    TextField,
    Box,
    Typography,
    Toolbar as MuiToolbar,
    AppBar,
    IconButton,
    Tooltip,
} from "@mui/material";
import { Description, FolderOpen, Save, Undo, Redo } from "@mui/icons-material";
import logo from "../assets/workflow_navigator_logo.svg";

const Toolbar = ({
    onNew,
    onSave,
    onLoad,
    isDirty,
    currentFile,
    title,
    onTitleChange,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState(title || "Untitled");
    const titleInputRef = useRef(null);

    // Update editTitle when title prop changes (e.g., when loading a file)
    useEffect(() => {
        setEditTitle(title || "Untitled");
    }, [title]);

    const handleTitleClick = () => {
        setIsEditingTitle(true);
        setEditTitle(title || "Untitled");
        setTimeout(() => titleInputRef.current?.focus(), 0);
    };

    const handleTitleSubmit = () => {
        onTitleChange(editTitle.trim() || "Untitled");
        setIsEditingTitle(false);
    };

    const handleTitleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleTitleSubmit();
        } else if (e.key === "Escape") {
            setEditTitle(title || "Untitled");
            setIsEditingTitle(false);
        }
    };

    const displayTitle =
        title || (currentFile ? currentFile.split("/").pop() : "Untitled");

    return (
        <AppBar
            position="static"
            color="default"
            elevation={1}
            sx={{ borderBottom: "1px solid #008093" }}
        >
            <MuiToolbar sx={{ gap: 2, minHeight: "80px !important" }}>
                <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
                    <img
                        src={logo}
                        alt="Workflow Navigator"
                        style={{
                            height: "64px",
                            width: "auto",
                        }}
                    />
                </Box>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Description />}
                    onClick={onNew}
                    title="New File (Ctrl+N)"
                    sx={{ textTransform: "none" }}
                >
                    New
                </Button>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FolderOpen />}
                    onClick={onLoad}
                    title="Load File (Ctrl+O)"
                    sx={{ textTransform: "none" }}
                >
                    Load
                </Button>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Save />}
                    onClick={onSave}
                    title="Save File (Ctrl+S)"
                    sx={{ textTransform: "none" }}
                    color={isDirty ? "warning" : "primary"}
                >
                    Save{isDirty ? " *" : ""}
                </Button>

                {/* Undo Button */}
                <Tooltip title={canUndo ? "Undo (Ctrl+Z)" : "Nothing to undo"}>
                    <span>
                        <IconButton
                            onClick={onUndo}
                            disabled={!canUndo}
                            size="small"
                            sx={{
                                color: canUndo ? "primary.main" : "disabled",
                            }}
                        >
                            <Undo />
                        </IconButton>
                    </span>
                </Tooltip>

                {/* Redo Button */}
                <Tooltip title={canRedo ? "Redo (Ctrl+Y)" : "Nothing to redo"}>
                    <span>
                        <IconButton
                            onClick={onRedo}
                            disabled={!canRedo}
                            size="small"
                            sx={{
                                color: canRedo ? "primary.main" : "disabled",
                            }}
                        >
                            <Redo />
                        </IconButton>
                    </span>
                </Tooltip>

                <Box
                    sx={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    {isEditingTitle ? (
                        <TextField
                            inputRef={titleInputRef}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={handleTitleKeyPress}
                            variant="outlined"
                            size="small"
                            sx={{
                                minWidth: "200px",
                                "& .MuiOutlinedInput-root": {
                                    fontSize: "18px",
                                    fontWeight: 600,
                                },
                            }}
                        />
                    ) : (
                        <Typography
                            variant="h6"
                            onClick={handleTitleClick}
                            sx={{
                                cursor: "pointer",
                                padding: "4px 8px",
                                borderRadius: "3px",
                                border: "1px solid transparent",
                                fontWeight: 600,
                                fontSize: "18px",
                                "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                                },
                            }}
                            title="Click to edit title"
                        >
                            {displayTitle}
                            {isDirty ? " (modified)" : ""}
                        </Typography>
                    )}
                </Box>
            </MuiToolbar>
        </AppBar>
    );
};

export default Toolbar;
