import React, { useState, useRef, useEffect } from "react";

const Toolbar = ({
    onNew,
    onSave,
    onLoad,
    isDirty,
    currentFile,
    title,
    onTitleChange,
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
        <div className="toolbar">
            <button onClick={onNew} title="New File (Ctrl+N)">
                📄 New
            </button>
            <button onClick={onLoad} title="Load File (Ctrl+O)">
                📂 Load
            </button>
            <button onClick={onSave} title="Save File (Ctrl+S)">
                💾 Save{isDirty ? "*" : ""}
            </button>
            <div
                className="title-section"
                style={{ marginLeft: "auto", fontSize: "14px", color: "#666" }}
            >
                {isEditingTitle ? (
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleTitleSubmit}
                        onKeyDown={handleTitleKeyPress}
                        style={{
                            border: "1px solid #ccc",
                            borderRadius: "3px",
                            padding: "2px 6px",
                            fontSize: "14px",
                            background: "white",
                            minWidth: "150px",
                        }}
                    />
                ) : (
                    <span
                        onClick={handleTitleClick}
                        style={{
                            cursor: "pointer",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            border: "1px solid transparent",
                        }}
                        className="editable-title"
                        title="Click to edit title"
                    >
                        {displayTitle}
                        {isDirty ? " (modified)" : ""}
                    </span>
                )}
            </div>
        </div>
    );
};

export default Toolbar;
