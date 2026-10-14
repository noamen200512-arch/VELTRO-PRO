import React from "react";
import ReactDOM from "react-dom/client";
import AuthGate from "./AuthGate.jsx";

import "./style.css";
import "./styles/sidebar.css";

ReactDOM.createRoot(document.getElementById("root")).render(
<React.StrictMode>
<AuthGate />
</React.StrictMode>
);