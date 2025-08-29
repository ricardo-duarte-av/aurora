import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import ClientStore from "./ClientStore.tsx";
import { Stores } from "./Stores";
import { uniffiInitAsync } from "./index.web.ts";

await uniffiInitAsync();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <Stores>
            <App />
        </Stores>
    </React.StrictMode>,
);
