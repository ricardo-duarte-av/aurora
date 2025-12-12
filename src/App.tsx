import type React from "react";
import type { ReactNode } from "react";
import "./App.css";
import { InlineSpinner } from "@vector-im/compound-web";
import { useViewModel } from "@element-hq/web-shared-components";
import { Client } from "./Client.tsx";
import { Login } from "./Login.tsx";
import { OidcCallback } from "./OidcCallback.tsx";
import { useClientStoreContext } from "./context/ClientStoreContext";
import { useClientStoresContext } from "./context/ClientStoresContext";
import { useSessionStoreContext } from "./context/SessionStoreContext";
import { ClientState } from "./viewmodel/client-view.types";
import { ClientViewModel } from "./viewmodel/ClientViewModel";

console.log("running App.tsx");

const App: React.FC = () => {
    const [clientViewModel, setClientViewModel] = useClientStoreContext();
    const [, addClientStore] = useClientStoresContext();
    const sessionStore = useSessionStoreContext();

    // Check if we're on the OIDC callback route
    const isOidcCallback = window.location.pathname === "/oidc/callback";

    // If this is the OIDC callback, render the callback handler
    if (isOidcCallback) {
        return <OidcCallback />;
    }

    const { clientState, loginViewModel } = useViewModel(clientViewModel);
    console.log("App rendering with clientState:", clientState);

    let component: ReactNode;
    if (
        clientState === ClientState.Unknown ||
        clientState === ClientState.LoadingSession ||
        clientState === ClientState.LoggedIn
    ) {
        component = (
            <div className="mx_LoadingSession">
                <InlineSpinner size={32} />
                <h2>Loading Session...</h2>
            </div>
        );
    } else if (clientState === ClientState.Syncing) {
        component = (
            <Client
                onAddAccount={() => {
                    console.log("Add Account clicked - creating new ClientViewModel");
                    const newClientViewModel = new ClientViewModel({
                        sessionStore,
                        onLogin: addClientStore,
                    });
                    console.log("Setting new ClientViewModel as active");
                    setClientViewModel(newClientViewModel);
                    console.log("Calling tryLoadSession (should transition to LoggedOut)");
                    newClientViewModel.tryLoadSession();
                }}
            />
        );
    } else if (
        clientState === ClientState.LoggedOut ||
        clientState === ClientState.LoggingIn
    ) {
        component = loginViewModel ? (
            <Login loginViewModel={loginViewModel} />
        ) : null;
    }

    return <div className="mx_App">{component}</div>;
};

export default App;

