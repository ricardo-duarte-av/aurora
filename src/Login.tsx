import {
    Form,
    Glass,
    InlineSpinner,
    TooltipProvider,
} from "@vector-im/compound-web";
import { useViewModel } from "@element-hq/web-shared-components";
import type React from "react";
import type { LoginViewModel } from "./viewmodel/LoginViewModel";

export interface LoginProps {
    loginViewModel: LoginViewModel;
}

export const Login: React.FC<LoginProps> = ({ loginViewModel }) => {
    const { username, password, server, canSubmit, loggingIn } =
        useViewModel(loginViewModel);

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
                                    await loginViewModel.login();
                                }}
                            >
                                <Form.Field name="username">
                                    <Form.Label>Username</Form.Label>
                                    <Form.TextControl
                                        disabled={loggingIn}
                                        value={username}
                                        onChange={(e) =>
                                            loginViewModel.setUsername(
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Form.Field>

                                <Form.Field name="password">
                                    <Form.Label>Password</Form.Label>
                                    <Form.PasswordControl
                                        disabled={loggingIn}
                                        value={password}
                                        onChange={(e) =>
                                            loginViewModel.setPassword(
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Form.Field>

                                <Form.Field name="server">
                                    <Form.Label>Server</Form.Label>
                                    <Form.TextControl
                                        disabled={loggingIn}
                                        value={server}
                                        onChange={(e) =>
                                            loginViewModel.setServer(
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Form.Field>

                                <Form.Submit disabled={!canSubmit}>
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
