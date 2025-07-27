const {
    app,
    BrowserWindow,
    Menu,
    dialog,
    ipcMain,
    shell,
} = require("electron");
const path = require("path");
// Better development detection
const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.ELECTRON_IS_DEV === "true" ||
    require("electron-is-dev");
const fs = require("fs");

console.log("Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("ELECTRON_IS_DEV:", process.env.ELECTRON_IS_DEV);
console.log("electron-is-dev result:", require("electron-is-dev"));
console.log("Final isDev:", isDev);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, "preload.js"),
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
        },
        icon: path.join(__dirname, "icon.png"),
        show: false, // Don't show until ready
    });

    const startUrl = isDev
        ? "http://localhost:3000"
        : `file://${path.join(__dirname, "../build/index.html")}`;

    console.log("isDev:", isDev);
    console.log("Loading URL:", startUrl);

    mainWindow.loadURL(startUrl).catch((err) => {
        console.error("Failed to load URL:", err);
        if (!isDev) {
            // Fallback for production builds
            dialog.showErrorBox(
                "Load Error",
                "Failed to load the application. Please ensure it was built correctly."
            );
        }
    });

    // Show window when ready to prevent visual flash
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });

    // Handle navigation for security
    mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        if (
            parsedUrl.origin !== "http://localhost:3000" &&
            parsedUrl.protocol !== "file:"
        ) {
            event.preventDefault();
        }
    });

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    createMenu();
}

function createMenu() {
    const template = [
        {
            label: "File",
            submenu: [
                {
                    label: "New",
                    accelerator: "CmdOrCtrl+N",
                    click: () => {
                        mainWindow.webContents.send("menu-new-file");
                    },
                },
                {
                    label: "Open",
                    accelerator: "CmdOrCtrl+O",
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            properties: ["openFile"],
                            filters: [
                                {
                                    name: "Flowchart Files",
                                    extensions: ["flowchart"],
                                },
                                { name: "JSON Files", extensions: ["json"] },
                                { name: "All Files", extensions: ["*"] },
                            ],
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            try {
                                const data = fs.readFileSync(
                                    result.filePaths[0],
                                    "utf-8"
                                );
                                mainWindow.webContents.send(
                                    "menu-open-file",
                                    data
                                );
                            } catch (error) {
                                dialog.showErrorBox(
                                    "Error",
                                    "Failed to open file: " + error.message
                                );
                            }
                        }
                    },
                },
                {
                    label: "Save",
                    accelerator: "CmdOrCtrl+S",
                    click: () => {
                        mainWindow.webContents.send("menu-save-file");
                    },
                },
                {
                    label: "Save As",
                    accelerator: "CmdOrCtrl+Shift+S",
                    click: () => {
                        mainWindow.webContents.send("menu-save-as-file");
                    },
                },
                { type: "separator" },
                {
                    label: "Exit",
                    accelerator:
                        process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
                    click: () => {
                        app.quit();
                    },
                },
            ],
        },
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
            ],
        },
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { role: "toggleDevTools" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        },
    ];

    if (process.platform === "darwin") {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: "about" },
                { type: "separator" },
                { role: "services", submenu: [] },
                { type: "separator" },
                { role: "hide" },
                { role: "hideothers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" },
            ],
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Handle file save requests from renderer
ipcMain.handle("save-file", async (event, data, suggestedName) => {
    try {
        // Validate input
        if (typeof data !== "string") {
            return { success: false, error: "Invalid data format" };
        }

        // Create default filename from suggested name or fallback
        let defaultPath = "flowchart.flowchart";
        if (suggestedName && suggestedName.trim()) {
            // Clean the suggested name for use as filename
            const cleanName = suggestedName
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "_");
            defaultPath = `${cleanName}.flowchart`;
        }

        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: defaultPath,
            filters: [
                { name: "Flowchart Files", extensions: ["flowchart"] },
                { name: "JSON Files", extensions: ["json"] },
            ],
        });

        if (!result.canceled && result.filePath) {
            try {
                // Validate JSON before saving
                JSON.parse(data);
                fs.writeFileSync(result.filePath, data, "utf8");
                return { success: true, filePath: result.filePath };
            } catch (error) {
                console.error("File save error:", error);
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: "Save canceled" };
    } catch (error) {
        console.error("Dialog error:", error);
        return { success: false, error: "Failed to open save dialog" };
    }
});

// Handle file open requests from renderer
ipcMain.handle("open-file", async (event) => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ["openFile"],
            filters: [
                { name: "Flowchart Files", extensions: ["flowchart"] },
                { name: "JSON Files", extensions: ["json"] },
                { name: "All Files", extensions: ["*"] },
            ],
        });

        if (!result.canceled && result.filePaths.length > 0) {
            try {
                const data = fs.readFileSync(result.filePaths[0], "utf-8");
                return {
                    success: true,
                    data: data,
                    filePath: result.filePaths[0],
                };
            } catch (error) {
                console.error("File read error:", error);
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: "Open canceled" };
    } catch (error) {
        console.error("Dialog error:", error);
        return { success: false, error: "Failed to open file dialog" };
    }
});

// Handle document attachment requests
ipcMain.handle("attach-document", async (event) => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ["openFile"],
            filters: [{ name: "PDF Documents", extensions: ["pdf"] }],
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            const fileName = path.basename(filePath);

            try {
                // Read the PDF file as base64 for storage
                const fileData = fs.readFileSync(filePath);
                const base64Data = fileData.toString("base64");

                return {
                    success: true,
                    fileName: fileName,
                    data: base64Data,
                    originalPath: filePath,
                };
            } catch (error) {
                console.error("File read error:", error);
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: "Document selection canceled" };
    } catch (error) {
        console.error("Dialog error:", error);
        return { success: false, error: "Failed to open document dialog" };
    }
});

// Handle document viewing requests
ipcMain.handle("open-document", async (event, documentData) => {
    try {
        if (!documentData || !documentData.data) {
            return { success: false, error: "No document data provided" };
        }

        // Create temporary file for viewing
        const tempDir = require("os").tmpdir();
        const tempFilePath = path.join(
            tempDir,
            `flowchart_doc_${Date.now()}_${documentData.fileName}`
        );

        // Write base64 data back to temporary file
        const buffer = Buffer.from(documentData.data, "base64");
        fs.writeFileSync(tempFilePath, buffer);

        // Open with default PDF viewer
        await shell.openPath(tempFilePath);

        // Clean up temp file after 30 seconds
        setTimeout(() => {
            try {
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            } catch (error) {
                console.error("Error cleaning up temp file:", error);
            }
        }, 30000);

        return { success: true };
    } catch (error) {
        console.error("Document open error:", error);
        return { success: false, error: error.message };
    }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
