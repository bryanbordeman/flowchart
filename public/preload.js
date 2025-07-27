const { contextBridge, ipcRenderer } = require("electron");

// Validate channels to prevent arbitrary IPC access
const validChannels = [
    "save-file",
    "open-file",
    "menu-new-file",
    "menu-open-file",
    "menu-save-file",
    "menu-save-as-file",
];

contextBridge.exposeInMainWorld("electronAPI", {
    saveFile: (data, suggestedName) => {
        if (typeof data !== "string") {
            throw new Error("Data must be a string");
        }
        return ipcRenderer.invoke("save-file", data, suggestedName);
    },
    openFile: () => {
        return ipcRenderer.invoke("open-file");
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
});
