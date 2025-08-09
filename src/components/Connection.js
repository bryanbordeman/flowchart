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

        // Use dynamic dimensions if available, otherwise use defaults
        let nodeWidth = node.width || 120;
        let nodeHeight = node.height || (node.type === "decision" ? 120 : 80);

        if (node.type === "decision") {
            // Decision is a square container with centered diamond
            const centerX = nodeX + nodeWidth / 2;
            const centerY = nodeY + nodeHeight / 2;

            switch (port) {
                case "top":
                    return { x: centerX, y: nodeY };
                case "right":
                    return { x: nodeX + nodeWidth, y: centerY };
                case "bottom":
                    return { x: centerX, y: nodeY + nodeHeight };
                case "left":
                    return { x: nodeX, y: centerY };
                default:
                    return { x: centerX, y: centerY };
            }
        } else if (node.type === "connector") {
            nodeWidth = node.width || 40;
            nodeHeight = node.height || 40;
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

        // Standard nodes (process, start, end, data) - use dynamic dimensions
        const centerX = nodeX + nodeWidth / 2;
        const centerY = nodeY + nodeHeight / 2;

        switch (port) {
            case "top":
                return { x: centerX, y: nodeY };
            case "right":
                return { x: nodeX + nodeWidth, y: centerY };
            case "bottom":
                return { x: centerX, y: nodeY + nodeHeight };
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
    // Determine Yes/No label based on decision type
    let decisionLabel = "";
    if (isFromDecision) {
        if (connection.decisionType === "yes") {
            decisionLabel = "Yes";
        } else if (connection.decisionType === "no") {
            decisionLabel = "No";
        }
    }

    // Delete button position - at the start point
    const deleteButtonPoint = {
        x: startPoint.x,
        y: startPoint.y,
    };
    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(connection.id);
    };

    // Smart routing with special decision handling
    const generateSmartPath = () => {
        let waypoints = [startPoint];

        // Special routing for Yes decisions from top port
        if (
            isFromDecision &&
            connection.decisionType === "yes" &&
            connection.fromPort === "top"
        ) {
            // Yes path: go up, turn left, then down to target
            const upDistance = 60;
            waypoints.push({ x: startPoint.x, y: startPoint.y - upDistance });
            waypoints.push({ x: endPoint.x, y: startPoint.y - upDistance });
        } else {
            // Force all connections through proper routing (no straight lines)
            if (false) {
                // Disabled straight line detection
            } else if (
                // L-shape routing for all connection types
                (connection.fromPort === "right" &&
                    (connection.toPort === "top" ||
                        connection.toPort === "bottom" ||
                        connection.toPort === "left")) ||
                (connection.fromPort === "left" &&
                    (connection.toPort === "top" ||
                        connection.toPort === "bottom" ||
                        connection.toPort === "right")) ||
                (connection.fromPort === "top" &&
                    (connection.toPort === "left" ||
                        connection.toPort === "right" ||
                        connection.toPort === "bottom")) ||
                (connection.fromPort === "bottom" &&
                    (connection.toPort === "left" ||
                        connection.toPort === "right" ||
                        connection.toPort === "top"))
            ) {
                // L-shape routing - ensure correct direction for arrow
                if (
                    connection.fromPort === "right" ||
                    connection.fromPort === "left"
                ) {
                    // For horizontal connections
                    if (
                        connection.toPort === "left" ||
                        connection.toPort === "right"
                    ) {
                        // Horizontal to horizontal - simpler routing with extensions
                        const extensionLength = 40;
                        const startExtension =
                            connection.fromPort === "right"
                                ? startPoint.x + extensionLength
                                : startPoint.x - extensionLength;
                        const endExtension =
                            connection.toPort === "right"
                                ? endPoint.x + extensionLength
                                : endPoint.x - extensionLength;

                        // Simple 3-segment path: extend -> across -> extend to target
                        waypoints.push({ x: startExtension, y: startPoint.y });
                        waypoints.push({ x: startExtension, y: endPoint.y });
                        waypoints.push({ x: endExtension, y: endPoint.y });
                    } else {
                        // Horizontal to vertical - go horizontal first, then vertical
                        waypoints.push({ x: endPoint.x, y: startPoint.y });
                    }
                } else {
                    // For vertical connections
                    if (
                        connection.toPort === "top" ||
                        connection.toPort === "bottom"
                    ) {
                        // Vertical to vertical - add extensions from both components
                        const extensionLength = 40;
                        const startExtension =
                            connection.fromPort === "bottom"
                                ? startPoint.y + extensionLength
                                : startPoint.y - extensionLength;
                        const endExtension =
                            connection.toPort === "bottom"
                                ? endPoint.y + extensionLength
                                : endPoint.y - extensionLength;

                        // Simple 3-segment path: extend -> across -> extend to target
                        waypoints.push({ x: startPoint.x, y: startExtension });
                        waypoints.push({ x: endPoint.x, y: startExtension });
                        waypoints.push({ x: endPoint.x, y: endExtension });
                    } else {
                        // Vertical to horizontal - go vertical first, then horizontal
                        waypoints.push({ x: startPoint.x, y: endPoint.y });
                    }
                }
            } else {
                // Same-side connections with offset
                const offset = 40;
                if (
                    connection.fromPort === "top" &&
                    connection.toPort === "top"
                ) {
                    const midY = Math.min(startPoint.y, endPoint.y) - offset;
                    waypoints.push({ x: startPoint.x, y: midY });
                    waypoints.push({ x: endPoint.x, y: midY });
                } else if (
                    connection.fromPort === "bottom" &&
                    connection.toPort === "bottom"
                ) {
                    const midY = Math.max(startPoint.y, endPoint.y) + offset;
                    waypoints.push({ x: startPoint.x, y: midY });
                    waypoints.push({ x: endPoint.x, y: midY });
                } else if (
                    connection.fromPort === "left" &&
                    connection.toPort === "left"
                ) {
                    const midX = Math.min(startPoint.x, endPoint.x) - offset;
                    waypoints.push({ x: midX, y: startPoint.y });
                    waypoints.push({ x: midX, y: endPoint.y });
                } else if (
                    connection.fromPort === "right" &&
                    connection.toPort === "right"
                ) {
                    const midX = Math.max(startPoint.x, endPoint.x) + offset;
                    waypoints.push({ x: midX, y: startPoint.y });
                    waypoints.push({ x: midX, y: endPoint.y });
                } else {
                    // Default L-shape
                    if (
                        connection.fromPort === "right" ||
                        connection.fromPort === "left"
                    ) {
                        waypoints.push({ x: endPoint.x, y: startPoint.y });
                    } else {
                        waypoints.push({ x: startPoint.x, y: endPoint.y });
                    }
                }
            }
        }

        // Ensure final segment creates correct arrow direction
        const lastWaypoint = waypoints[waypoints.length - 1];

        // Add orthogonal routing to endpoint if needed
        if (lastWaypoint.x !== endPoint.x && lastWaypoint.y !== endPoint.y) {
            // We need an intermediate point to maintain orthogonal routing
            if (connection.toPort === "top" || connection.toPort === "bottom") {
                // For top/bottom ports, align horizontally first
                waypoints.push({ x: endPoint.x, y: lastWaypoint.y });
            } else {
                // For left/right ports, align vertically first
                waypoints.push({ x: lastWaypoint.x, y: endPoint.y });
            }
        }

        // Create extension point BEFORE the endpoint to ensure correct arrow direction
        // Make sure the approach is orthogonal to avoid diagonal lines
        const currentLastWaypoint = waypoints[waypoints.length - 1];

        if (connection.toPort === "top") {
            // Ensure we approach vertically from above
            if (currentLastWaypoint.x !== endPoint.x) {
                waypoints.push({ x: endPoint.x, y: currentLastWaypoint.y });
            }
            // Add tiny approach point for correct arrow direction
            waypoints.push({ x: endPoint.x, y: endPoint.y - 2 });
        } else if (connection.toPort === "bottom") {
            // Ensure we approach vertically from below
            if (currentLastWaypoint.x !== endPoint.x) {
                waypoints.push({ x: endPoint.x, y: currentLastWaypoint.y });
            }
            // Add tiny approach point for correct arrow direction
            waypoints.push({ x: endPoint.x, y: endPoint.y + 2 });
        } else if (connection.toPort === "left") {
            // Ensure we approach horizontally from left
            if (currentLastWaypoint.y !== endPoint.y) {
                waypoints.push({ x: currentLastWaypoint.x, y: endPoint.y });
            }
            // Add tiny approach point for correct arrow direction
            waypoints.push({ x: endPoint.x - 2, y: endPoint.y });
        } else if (connection.toPort === "right") {
            // Ensure we approach horizontally from right
            if (currentLastWaypoint.y !== endPoint.y) {
                waypoints.push({ x: currentLastWaypoint.x, y: endPoint.y });
            }
            // Add tiny approach point for correct arrow direction
            waypoints.push({ x: endPoint.x + 2, y: endPoint.y });
        }

        // End at the actual port location
        waypoints.push(endPoint);

        return waypoints;
    };

    // Generate smart path
    const pathPoints = generateSmartPath();
    const points = pathPoints.map((point) => `${point.x},${point.y}`).join(" ");

    // Calculate label position at the start of the line
    let labelPoint = null;
    if (isFromDecision && decisionLabel && pathPoints.length >= 2) {
        // Position label near the start of the connection line
        const startPoint = pathPoints[0];
        const secondPoint = pathPoints[1];

        // Position label 20 pixels along the first segment
        const dx = secondPoint.x - startPoint.x;
        const dy = secondPoint.y - startPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const offset = Math.min(20, distance * 0.3); // 20 pixels or 30% of segment length
            const ratio = offset / distance;

            labelPoint = {
                x: startPoint.x + dx * ratio,
                y: startPoint.y + dy * ratio,
            };

            // Add slight perpendicular offset to avoid overlapping the line
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal line - offset vertically
                labelPoint.y += connection.decisionType === "no" ? 20 : -20;
            } else {
                // Vertical line - offset horizontally
                labelPoint.x += connection.decisionType === "no" ? 20 : -20;
            }
        }
    }

    return (
        <g className="connection-group">
            {/* Main connection line */}
            <polyline
                points={points}
                fill="none"
                stroke="#4682B4"
                strokeWidth="2"
                className="connection-line"
                markerEnd="url(#arrowhead)"
            />

            {/* Decision label with background and border */}
            {isFromDecision && decisionLabel && labelPoint && (
                <g>
                    {/* Background rectangle with border */}
                    <rect
                        x={labelPoint.x - 16}
                        y={labelPoint.y - 10}
                        width="32"
                        height="20"
                        fill="white"
                        stroke="#4682B4"
                        strokeWidth="1"
                        rx="10"
                        ry="10"
                        style={{
                            userSelect: "none",
                            pointerEvents: "none",
                        }}
                    />
                    {/* Decision label text */}
                    <text
                        x={labelPoint.x}
                        y={labelPoint.y + 4}
                        textAnchor="middle"
                        fill="#4682B4"
                        fontSize="12"
                        fontWeight="bold"
                        className={`decision-label decision-${connection.decisionType}`}
                        data-connection-id={connection.id}
                        style={{
                            userSelect: "none",
                            pointerEvents: "none",
                        }}
                    >
                        {decisionLabel}
                    </text>
                </g>
            )}

            {/* Delete button - invisible clickable area */}
            <circle
                cx={deleteButtonPoint.x}
                cy={deleteButtonPoint.y}
                r="15"
                fill="transparent"
                className="connection-delete-area"
                style={{ cursor: "pointer" }}
                onClick={handleDelete}
            />

            {/* Delete button - visible button */}
            <circle
                cx={deleteButtonPoint.x}
                cy={deleteButtonPoint.y}
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

            {/* Delete button - X text */}
            <text
                x={deleteButtonPoint.x}
                y={deleteButtonPoint.y + 3}
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
