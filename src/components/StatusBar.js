import React from "react";

const StatusBar = ({
    nodeCount,
    connectionCount,
    selectedNode,
    selectedNodes,
    selectedContainers,
    isDirty,
    isConnecting,
}) => {
    const getSelectionInfo = () => {
        let info = [];

        if (selectedNode) {
            info.push(`Node: ${selectedNode}`);
        }

        if (selectedNodes && selectedNodes.length > 0) {
            info.push(`${selectedNodes.length} nodes selected`);
        }

        if (selectedContainers && selectedContainers.length > 0) {
            info.push(`${selectedContainers.length} containers selected`);
        }

        return info.length > 0 ? ` | Selected: ${info.join(", ")}` : "";
    };

    return (
        <div className="status-bar">
            <span>Nodes: {nodeCount}</span>
            <span> | Connections: {connectionCount}</span>
            {getSelectionInfo()}
            {isConnecting && <span> | 🔗 Creating connection...</span>}
            {isDirty && <span> | Modified</span>}
        </div>
    );
};

export default StatusBar;
