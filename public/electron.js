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
    console.log("__dirname:", __dirname);
    console.log("Resolved path:", path.join(__dirname, "../build/index.html"));

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

// Handle saving to existing file without dialog
ipcMain.handle("save-file-direct", async (event, data, filePath) => {
    try {
        // Validate input
        if (typeof data !== "string") {
            return { success: false, error: "Invalid data format" };
        }

        if (!filePath || typeof filePath !== "string") {
            return { success: false, error: "Invalid file path" };
        }

        try {
            // Validate JSON before saving
            JSON.parse(data);
            fs.writeFileSync(filePath, data, "utf8");
            return { success: true, filePath: filePath };
        } catch (error) {
            console.error("File save error:", error);
            return { success: false, error: error.message };
        }
    } catch (error) {
        console.error("Direct save error:", error);
        return { success: false, error: "Failed to save file directly" };
    }
});

// Handle opening a specific linked file
ipcMain.handle("open-linked-file", async (event, filePath) => {
    try {
        if (!filePath || typeof filePath !== "string") {
            return { success: false, error: "Invalid file path" };
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return {
                success: false,
                error: "Linked file not found: " + filePath,
            };
        }

        try {
            const data = fs.readFileSync(filePath, "utf-8");
            return {
                success: true,
                data: data,
                filePath: filePath,
            };
        } catch (error) {
            console.error("Linked file read error:", error);
            return {
                success: false,
                error: "Failed to read linked file: " + error.message,
            };
        }
    } catch (error) {
        console.error("Linked file open error:", error);
        return {
            success: false,
            error: "Failed to open linked file: " + error.message,
        };
    }
});

// Handle document attachment requests
ipcMain.handle("attach-document", async (event) => {
    console.log("Electron: Starting document attachment dialog...");
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ["openFile", "multiSelections"],
            filters: [
                {
                    name: "All Supported",
                    extensions: [
                        "pdf",
                        "doc",
                        "docx",
                        "xls",
                        "xlsx",
                        "png",
                        "jpg",
                        "jpeg",
                        "dwg",
                        "dxf",
                        "sldprt",
                        "sldasm",
                        "slddrw",
                    ],
                },
                { name: "PDF Documents", extensions: ["pdf"] },
                { name: "Word Documents", extensions: ["doc", "docx"] },
                { name: "Excel Documents", extensions: ["xls", "xlsx"] },
                {
                    name: "Images (PNG/JPEG only)",
                    extensions: ["png", "jpg", "jpeg"],
                },
                { name: "AutoCAD Files", extensions: ["dwg", "dxf"] },
                {
                    name: "SolidWorks Files",
                    extensions: ["sldprt", "sldasm", "slddrw"],
                },
                { name: "All Files", extensions: ["*"] },
            ],
        });

        console.log("Dialog result:", result);

        if (!result.canceled && result.filePaths.length > 0) {
            console.log("Processing files:", result.filePaths);
            const attachedDocuments = [];

            for (const filePath of result.filePaths) {
                const fileName = path.basename(filePath);
                const fileExtension = path.extname(filePath).toLowerCase();

                try {
                    // Read the file as base64 for storage
                    const fileData = fs.readFileSync(filePath);
                    const base64Data = fileData.toString("base64");
                    const fileSize = fileData.length;

                    // Determine file type and appropriate mime type
                    let fileType = "unknown";
                    let mimeType = "application/octet-stream";

                    if ([".pdf"].includes(fileExtension)) {
                        fileType = "pdf";
                        mimeType = "application/pdf";
                    } else if ([".doc", ".docx"].includes(fileExtension)) {
                        fileType = "word";
                        mimeType =
                            fileExtension === ".doc"
                                ? "application/msword"
                                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    } else if ([".xls", ".xlsx"].includes(fileExtension)) {
                        fileType = "excel";
                        mimeType =
                            fileExtension === ".xls"
                                ? "application/vnd.ms-excel"
                                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    } else if (fileExtension === ".png") {
                        fileType = "png";
                        mimeType = "image/png";
                    } else if ([".jpg", ".jpeg"].includes(fileExtension)) {
                        fileType = "jpeg";
                        mimeType = "image/jpeg";
                    } else if ([".dwg", ".dxf"].includes(fileExtension)) {
                        fileType = "autocad";
                        mimeType = "application/octet-stream";
                    } else if (
                        [".sldprt", ".sldasm", ".slddrw"].includes(
                            fileExtension
                        )
                    ) {
                        fileType = "solidworks";
                        mimeType = "application/octet-stream";
                    }

                    attachedDocuments.push({
                        id:
                            Date.now().toString() +
                            "_" +
                            Math.random().toString(36).substr(2, 9),
                        fileName: fileName,
                        fileType: fileType,
                        fileExtension: fileExtension,
                        mimeType: mimeType,
                        fileSize: fileSize,
                        data: base64Data,
                        originalPath: filePath,
                        attachedAt: new Date().toISOString(),
                    });
                } catch (error) {
                    console.error(`File read error for ${fileName}:`, error);
                    // Continue with other files even if one fails
                }
            }

            if (attachedDocuments.length > 0) {
                console.log(
                    "Successfully processed documents:",
                    attachedDocuments.length
                );
                const returnValue = {
                    success: true,
                    documents: attachedDocuments,
                };
                console.log("Returning:", returnValue);
                return returnValue;
            } else {
                console.log("No documents were successfully processed");
                return {
                    success: false,
                    error: "Failed to process any of the selected files",
                };
            }
        }
        console.log("User canceled file selection");
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

// Handle folder attachment requests
ipcMain.handle("attach-folder", async (event) => {
    console.log("Electron: Starting folder attachment dialog...");
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ["openDirectory"],
            title: "Select Folder to Link",
        });

        console.log("Folder dialog result:", result);

        if (!result.canceled && result.filePaths.length > 0) {
            const folderPath = result.filePaths[0];
            const folderName = path.basename(folderPath);

            const folder = {
                id:
                    Date.now().toString() +
                    "_" +
                    Math.random().toString(36).substr(2, 9),
                name: folderName,
                path: folderPath,
                linkedAt: new Date().toISOString(),
            };

            console.log("Successfully selected folder:", folder);
            return {
                success: true,
                folder: folder,
            };
        } else {
            console.log("Folder selection canceled");
            return { success: false, error: "Folder selection canceled" };
        }
    } catch (error) {
        console.error("Folder dialog error:", error);
        return { success: false, error: "Failed to open folder dialog" };
    }
});

// Handle folder opening requests
ipcMain.handle("open-folder", async (event, folderData) => {
    console.log("Electron: Opening folder:", folderData);
    try {
        if (!folderData || !folderData.path) {
            throw new Error("Invalid folder data");
        }

        // Check if folder exists
        if (!fs.existsSync(folderData.path)) {
            throw new Error("Folder no longer exists at: " + folderData.path);
        }

        // Open folder in file explorer
        await shell.openPath(folderData.path);
        return { success: true };
    } catch (error) {
        console.error("Folder open error:", error);
        return { success: false, error: error.message };
    }
});

app.whenReady().then(() => {
    // Set dock icon on macOS
    if (process.platform === "darwin") {
        app.dock.setIcon(path.join(__dirname, "icon.png"));
    }
    createWindow();
});

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
