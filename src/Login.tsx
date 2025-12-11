import {
    Form,
    Glass,
    InlineSpinner,
    TooltipProvider,
} from "@vector-im/compound-web";
import type React from "react";
import { useState } from "react";
import { useClientStoreContext } from "./context/ClientStoreContext";
import { useClientStoresContext } from "./context/ClientStoresContext";

export interface LoginProps {
    loggingIn: boolean;
}

export const Login: React.FC<LoginProps> = ({ loggingIn }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [server, setServer] = useState("matrix.org");
    const [clientViewModel] = useClientStoreContext();
    const [, addClientStore] = useClientStoresContext();

    return (
        <div className="mx_LoginPage">
            <div className="mx_Login">
                <Glass>
                    <div className="mx_Login_dialog">
                        <TooltipProvider>
                            <Form.Root
                                style={{ padding: "var(--cpd-space-5x)" }}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    await clientViewModel.login({
                                        username,
                                        password,
                                        server: `https://${server}`,
                                    });
                                    // After login completes, get userId from snapshot
                                    const userId = clientViewModel.getSnapshot().userId;
                                    console.log("Login completed, userId:", userId);
                                    if (userId) {
                                        console.log("Adding client store for userId:", userId);
                                        addClientStore(userId, clientViewModel);
                                    }
                                }}
                            >
                                <Form.Field name="username">
                                    <Form.Label>Username</Form.Label>
                                    <Form.TextControl
                                        disabled={loggingIn}
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                    />
                                </Form.Field>

                                <Form.Field name="password">
                                    <Form.Label>Password</Form.Label>
                                    <Form.PasswordControl
                                        disabled={loggingIn}
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                    />
                                </Form.Field>

                                <Form.Field name="server">
                                    <Form.Label>Server</Form.Label>
                                    <Form.TextControl
                                        disabled={loggingIn}
                                        value={server}
                                        onChange={(e) =>
                                            setServer(e.target.value)
                                        }
                                    />
                                </Form.Field>

                                <Form.Submit
                                    disabled={!username || !password || !server}
                                >
                                    {loggingIn ? <InlineSpinner /> : "Login"}
                                </Form.Submit>
                            </Form.Root>
                        </TooltipProvider>
                    </div>
                </Glass>
            </div>
        </div>
    );
};
