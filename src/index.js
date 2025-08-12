import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Suppress defaultProps warnings from react-color library
const originalError = console.error;
console.error = (...args) => {
    if (
        typeof args[0] === "string" &&
        args[0].includes("Support for defaultProps will be removed")
    ) {
        return;
    }
    originalError.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
