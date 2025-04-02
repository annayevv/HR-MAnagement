import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "select2/dist/css/select2.min.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);

// Optional: Log performance metrics
reportWebVitals();
