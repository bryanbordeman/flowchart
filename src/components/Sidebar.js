import React from "react";

const componentTypes = [
    { type: "start-end", label: "Start/End", icon: "⬭" },
    { type: "process", label: "Process", icon: "▭" },
    { type: "decision", label: "Decision", icon: "◆" },
    { type: "input-output", label: "Input/Output", icon: "▱" },
];

const Sidebar = ({ onAddNode }) => {
    const handleDragStart = (e, type) => {
        e.dataTransfer.setData("nodeType", type);
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleClick = (type) => {
        // Add node at a default position when clicked
        const position = {
            x: Math.random() * 200 + 100,
            y: Math.random() * 200 + 100,
        };
        onAddNode(type, position);
    };

    return (
        <div className="sidebar">
            <h3>Components</h3>
            {componentTypes.map(({ type, label, icon }) => (
                <div
                    key={type}
                    className="component-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, type)}
                    onClick={() => handleClick(type)}
                    title={`Drag to canvas or click to add ${label}`}
                >
                    <span className="component-icon">{icon}</span>
                    <span>{label}</span>
                </div>
            ))}
            <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
                <p>
                    💡 Tip: Drag components to the canvas or click to add at a
                    random position.
                </p>
            </div>
        </div>
    );
};

export default Sidebar;
