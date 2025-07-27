import React from "react";

const StatusBar = ({
    nodeCount,
    connectionCount,
    selectedNode,
    isDirty,
    isConnecting,
}) => {
    return (
        <div className="status-bar">
            <span>Nodes: {nodeCount}</span>
            <span> | Connections: {connectionCount}</span>
            {selectedNode && <span> | Selected: {selectedNode}</span>}
            {isConnecting && <span> | 🔗 Creating connection...</span>}
            {isDirty && <span> | Modified</span>}
        </div>
    );
};

export default StatusBar;
