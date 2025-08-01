import React from "react";

const Connection = ({ connection, nodes, onDelete }) => {
    const fromNode = nodes.find((node) => node.id === connection.from);
    const toNode = nodes.find((node) => node.id === connection.to);

    if (!fromNode || !toNode) {
        return null;
    }

    // Helper function to get port position
    const getPortPosition = (node, port) => {
        const nodeX = node.position.x;
        const nodeY = node.position.y;

        // Different dimensions for different node types
        let nodeWidth = 120;
        let nodeHeight = 80;

        if (node.type === "decision") {
            // Decision is a 120x120 container with centered diamond
            const centerX = nodeX + 60; // Center of 120px diamond container
            const centerY = nodeY + 60;

            switch (port) {
                case "top":
                    return { x: centerX, y: nodeY };
                case "right":
                    return { x: nodeX + 120, y: centerY };
                case "bottom":
                    return { x: centerX, y: nodeY + 120 };
                case "left":
                    return { x: nodeX, y: centerY };
                default:
                    return { x: centerX, y: centerY };
            }
        } else if (node.type === "connector") {
            nodeWidth = 40;
            nodeHeight = 40;
            // Use dynamic positioning for connector
            switch (port) {
                case "top":
                    return {
                        x: nodeX + nodeWidth / 2,
                        y: nodeY,
                    };
                case "right":
                    return {
                        x: nodeX + nodeWidth,
                        y: nodeY + nodeHeight / 2,
                    };
                case "bottom":
                    return {
                        x: nodeX + nodeWidth / 2,
                        y: nodeY + nodeHeight,
                    };
                case "left":
                    return {
                        x: nodeX,
                        y: nodeY + nodeHeight / 2,
                    };
                default:
                    return {
                        x: nodeX + nodeWidth / 2,
                        y: nodeY + nodeHeight / 2,
                    };
            }
        }

        // Standard nodes (process, start, end, data) - 120x80
        const centerX = nodeX + 60; // Center of 120px width
        const centerY = nodeY + 40; // Center of 80px height

        switch (port) {
            case "top":
                return { x: centerX, y: nodeY };
            case "right":
                return { x: nodeX + 120, y: centerY };
            case "bottom":
                return { x: centerX, y: nodeY + 80 };
            case "left":
                return { x: nodeX, y: centerY };
            default:
                return { x: centerX, y: centerY };
        }
    };

    // Get start and end points based on ports
    const startPoint = getPortPosition(fromNode, connection.fromPort);
    const endPoint = getPortPosition(toNode, connection.toPort);

    // Calculate direction vector for arrowhead
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return null;

    // Determine if this connection is from a decision node
    const isFromDecision = fromNode.type === "decision";
    // Calculate label position (further from the start point for decision labels)
    const labelOffset = isFromDecision ? 35 : 20;
    const labelPoint = {
        x: startPoint.x + (dx * labelOffset) / distance,
        y: startPoint.y + (dy * labelOffset) / distance,
    };
    // Determine Yes/No label based on decision type
    let decisionLabel = "";
    if (isFromDecision) {
        if (connection.decisionType === "yes") {
            decisionLabel = "Yes";
        } else if (connection.decisionType === "no") {
            decisionLabel = "No";
        }
    }
    // Midpoint for delete button
    const midPoint = {
        x: (startPoint.x + endPoint.x) / 2,
        y: (startPoint.y + endPoint.y) / 2,
    };
    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(connection.id);
    };

    // Polyline logic for vertical connections
    let points;
    // Draw right-angle if both ports are 'top' or both are 'bottom',
    // or if the connection is between two vertically stacked components (same x)
    const isVerticalStack =
        startPoint.x === endPoint.x && startPoint.y !== endPoint.y;
    const isSideStack =
        startPoint.x === endPoint.x &&
        startPoint.y !== endPoint.y &&
        ((connection.fromPort === "left" && connection.toPort === "left") ||
            (connection.fromPort === "right" && connection.toPort === "right"));
    if (
        (connection.fromPort === "top" && connection.toPort === "top") ||
        (connection.fromPort === "bottom" && connection.toPort === "bottom")
    ) {
        // Right angle: vertical, horizontal, vertical (3 lines)
        const lead = 62;
        let firstY, lastY;
        if (connection.fromPort === "top") {
            firstY = startPoint.y - lead;
        } else {
            firstY = startPoint.y + lead;
        }
        if (connection.toPort === "top") {
            lastY = endPoint.y - lead;
        } else {
            lastY = endPoint.y + lead;
        }
        points = [
            `${startPoint.x},${startPoint.y}`,
            `${startPoint.x},${firstY}`,
            `${endPoint.x},${firstY}`,
            `${endPoint.x},${lastY}`,
            `${endPoint.x},${endPoint.y}`,
        ].join(" ");
    } else if (isSideStack) {
        // Right angle: horizontal, vertical, horizontal (3 lines)
        const lead = 62;
        let firstX, lastX;
        if (connection.fromPort === "left") {
            firstX = startPoint.x - lead;
        } else {
            firstX = startPoint.x + lead;
        }
        if (connection.toPort === "left") {
            lastX = endPoint.x - lead;
        } else {
            lastX = endPoint.x + lead;
        }
        points = [
            `${startPoint.x},${startPoint.y}`,
            `${firstX},${startPoint.y}`,
            `${firstX},${endPoint.y}`,
            `${lastX},${endPoint.y}`,
            `${endPoint.x},${endPoint.y}`,
        ].join(" ");
    }

    return (
        <g className="connection-group">
            {/* Main connection line or polyline */}
            {points ? (
                <polyline
                    points={points}
                    fill="none"
                    stroke="#4682B4"
                    strokeWidth="2"
                    className="connection-line"
                    markerEnd="url(#arrowhead)"
                />
            ) : (
                <line
                    x1={startPoint.x}
                    y1={startPoint.y}
                    x2={endPoint.x}
                    y2={endPoint.y}
                    stroke="#4682B4"
                    strokeWidth="2"
                    className="connection-line"
                    markerEnd="url(#arrowhead)"
                />
            )}

            {/* Invisible clickable area for delete */}
            <circle
                cx={midPoint.x}
                cy={midPoint.y}
                r="15"
                fill="transparent"
                className="connection-delete-area"
                style={{ cursor: "pointer" }}
                onClick={handleDelete}
            />
            {/* Visible delete button (shown on hover) */}
            <circle
                cx={midPoint.x}
                cy={midPoint.y}
                r="8"
                fill="#dc3545"
                className="connection-delete-button"
                onClick={handleDelete}
                style={{
                    cursor: "pointer",
                    opacity: 0,
                    transition: "opacity 0.2s",
                }}
            />
            {/* Delete X text */}
            <text
                x={midPoint.x}
                y={midPoint.y + 3}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold"
                className="connection-delete-text"
                onClick={handleDelete}
                style={{
                    cursor: "pointer",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
            >
                ×
            </text>
        </g>
    );
};

export default Connection;
