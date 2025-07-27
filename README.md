# Flowchart - **Interactive Editing**: Double-click nodes to edit text

-   **Node Connections**: Righ- **Electron**: Desktop app framework
-   **React**: UI framework
-   **react-draggable**: For drag and drop functionality
-   **SVG**: Vector graphics for connection lines with arrows
-   **HTML5**: Canvas with grid background

## Future Enhancements

-   Advanced connection routing (curved lines, avoid overlaps)
-   Connection labels and conditions
-   Multiple connection points per nodeto start connections, click target to complete
-   **Save/Load**: Save flowcharts as .flowchart or .json files
-   **Cross-Platform**: Works on macOS, Windows, and Linux

A desktop flowchart application built with Electron and React. Create, edit, and save flowcharts with drag-and-drop functionality.

## Features

-   **Drag & Drop Interface**: Drag flowchart components from the sidebar to the canvas
-   **Multiple Node Types**:
    -   Start/End (oval shape)
    -   Process (rectangle)
    -   Decision (diamond)
    -   Connector (circle)
-   **Interactive Editing**: Double-click nodes to edit text
-   **Save/Load**: Save flowcharts as .flowchart or .json files
-   **Cross-Platform**: Works on macOS, Windows, and Linux

## Development

To run the app in development mode:

```bash
npm install
npm run start-electron
```

This will start both the React development server and Electron.

## Building

To build the app for production:

```bash
npm run build
npm run electron-pack
```

## Usage

1. **Adding Nodes**:

    - Drag components from the left sidebar to the canvas
    - Or click on sidebar components to add them at random positions

2. **Editing Nodes**:

    - Double-click any node to edit its text
    - Press Enter to save, Escape to cancel

3. **Moving Nodes**:

    - Click and drag nodes to reposition them

4. **Creating Connections**:

    - Right-click any node to start a connection
    - Click on another node to complete the connection
    - Arrows will appear showing the flow direction

5. **Deleting Connections**:

    - Hover over any connection line
    - Click the red × button that appears on the connection

6. **Deleting Nodes**:

    - Select a node and click the red × button that appears
    - This will also delete all connections to/from that node

7. **Saving/Loading**:
    - Use Ctrl+S (Cmd+S on Mac) to save
    - Use Ctrl+O (Cmd+O on Mac) to open existing files
    - Use Ctrl+N (Cmd+N on Mac) to create a new flowchart

## File Format

Flowcharts are saved as JSON files with the following structure:

```json
{
    "nodes": [
        {
            "id": "unique-id",
            "type": "process|decision|start-end|connector",
            "position": { "x": 100, "y": 100 },
            "text": "Node text"
        }
    ],
    "connections": [
        {
            "id": "unique-connection-id",
            "from": "node-id-1",
            "to": "node-id-2"
        }
    ]
}
```

## Technologies Used

-   **Electron**: Desktop app framework
-   **React**: UI framework
-   **react-draggable**: For drag and drop functionality
-   **HTML5**: Canvas with grid background

## Future Enhancements

-   Connecting lines between nodes
-   Undo/Redo functionality
-   Copy/Paste nodes
-   Zoom and pan controls
-   Export to PNG/PDF
-   Templates and themes
