const { contextBridge, ipcRenderer } = require("electron");

// Validate channels to prevent arbitrary IPC access
const validChannels = [
    "save-file",
    "save-file-direct",
    "open-file",
    "open-linked-file",
    "menu-new-file",
    "menu-open-file",
    "menu-save-file",
    "menu-save-as-file",
    "attach-document",
    "open-document",
    "attach-folder",
    "open-folder",
];

contextBridge.exposeInMainWorld("electronAPI", {
    saveFile: (data, suggestedName) => {
        if (typeof data !== "string") {
            throw new Error("Data must be a string");
        }
        return ipcRenderer.invoke("save-file", data, suggestedName);
    },
    saveFileDirect: (data, filePath) => {
        if (typeof data !== "string") {
            throw new Error("Data must be a string");
        }
        if (typeof filePath !== "string") {
            throw new Error("File path must be a string");
        }
        return ipcRenderer.invoke("save-file-direct", data, filePath);
    },
    openFile: () => {
        return ipcRenderer.invoke("open-file");
    },
    openLinkedFile: (filePath) => {
        if (typeof filePath !== "string") {
            throw new Error("File path must be a string");
        }
        return ipcRenderer.invoke("open-linked-file", filePath);
    },
    onMenuNewFile: (callback) => {
        if (typeof callback !== "function") {
            throw new Error("Callback must be a function");
        }
        ipcRenderer.on("menu-new-file", callback);
    },
    onMenuOpenFile: (callback) => {
        if (typeof callback !== "function") {
            throw new Error("Callback must be a function");
        }
        ipcRenderer.on("menu-open-file", callback);
    },
    onMenuSaveFile: (callback) => {
        if (typeof callback !== "function") {
            throw new Error("Callback must be a function");
        }
        ipcRenderer.on("menu-save-file", callback);
    },
    onMenuSaveAsFile: (callback) => {
        if (typeof callback !== "function") {
            throw new Error("Callback must be a function");
        }
        ipcRenderer.on("menu-save-as-file", callback);
    },
    removeAllListeners: (channel) => {
        if (!validChannels.includes(channel)) {
            throw new Error("Invalid channel");
        }
        ipcRenderer.removeAllListeners(channel);
    },
    attachDocument: () => {
        return ipcRenderer.invoke("attach-document");
    },
    openDocument: (filePath) => {
        return ipcRenderer.invoke("open-document", filePath);
    },
    attachFolder: () => {
        return ipcRenderer.invoke("attach-folder");
    },
    openFolder: (folderData) => {
        return ipcRenderer.invoke("open-folder", folderData);
    },
});
