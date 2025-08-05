import React from "react";

const StatusBar = ({
    nodeCount,
    connectionCount,
    selectedNode,
    selectedNodes,
    selectedContainers,
    isDirty,
    isConnecting,
    zoom,
    onZoomChange,
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
            <div className="status-info">
                <span>Nodes: {nodeCount}</span>
                <span> | Connections: {connectionCount}</span>
                {getSelectionInfo()}
                {isConnecting && <span> | 🔗 Creating connection...</span>}
                {isDirty && <span> | Modified</span>}
            </div>

            {/* Zoom controls */}
            {zoom !== undefined && onZoomChange && (
                <div className="zoom-controls">
                    <span className="zoom-label">Zoom</span>
                    <div className="zoom-slider-container">
                        <input
                            type="range"
                            min={0.2}
                            max={2}
                            step={0.01}
                            value={zoom}
                            onChange={(e) =>
                                onZoomChange(Number(e.target.value))
                            }
                            className="zoom-slider"
                        />
                        {/* 100% marker - clickable to snap to 1.0 */}
                        <div
                            className="zoom-marker-100"
                            onClick={() => onZoomChange(1.0)}
                            title="Click to reset to 100%"
                        >
                            <div className="zoom-marker-line"></div>
                        </div>
                    </div>
                    <span className="zoom-percentage">
                        {Math.round(zoom * 100)}%
                    </span>
                </div>
            )}
        </div>
    );
};

export default StatusBar;
