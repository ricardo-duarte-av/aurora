import type React from "react";
import { type ReactNode, useSyncExternalStore } from "react";
import "./App.css";
import { InlineSpinner } from "@vector-im/compound-web";
import { Client } from "./Client.tsx";
import ClientStore from "./ClientStore.tsx";
import { ClientState } from "./ClientStore.tsx";
import { Login } from "./Login.tsx";
import { SessionStore } from "./SessionStore";
import {
    ClientStoreContext,
    useClientStoreContext,
} from "./context/ClientStoreContext";
import { useSessionStoreContext } from "./context/SessionStoreContext";

console.log("running App.tsx");

const App: React.FC = () => {
    const [clientStore, setClientStore] = useClientStoreContext();
    const sessionStore = useSessionStoreContext();

    const clientState = useSyncExternalStore(
        clientStore.subscribe,
        clientStore.getSnapshot,
    );

    let component: ReactNode;
    if (
        clientState === ClientState.Unknown ||
        clientState === ClientState.LoadingSession
    ) {
        component = (
            <div className="mx_LoadingSession">
                <InlineSpinner size={32} />
                <h2>Loading Session...</h2>
            </div>
        );
    } else if (clientState === ClientState.LoggedIn) {
        component = (
            <Client
                onAddAccount={() => {
                    const clientStore = new ClientStore(sessionStore);
                    clientStore.tryLoadSession();
                    setClientStore(clientStore);
                }}
            />
        );
    } else if (
        clientState === ClientState.LoggedOut ||
        clientState === ClientState.LoggingIn
    ) {
        component = <Login loggingIn={clientState === ClientState.LoggingIn} />;
    }

    return <div className="mx_App cpd-theme-dark">{component}</div>;
};

export default App;
