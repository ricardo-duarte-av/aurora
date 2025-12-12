import {
    Button,
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
    const {
        username,
        password,
        server,
        canSubmit,
        loggingIn,
        error,
        checking,
        supportsOidc,
        supportsPassword,
    } = useViewModel(loginViewModel);

    // Show server input first, before we know capabilities
    const showServerOnly = supportsOidc === null && supportsPassword === null;

    // Show OIDC flow if supported
    const showOidcFlow = supportsOidc === true;

    // Show password form if OIDC is not supported or user chose password
    const showPasswordForm =
        supportsOidc === false && supportsPassword === true;

    return (
        <div className="mx_LoginPage">
            <div className="mx_Login">
                <Glass>
                    <div className="mx_Login_dialog">
                        <TooltipProvider>
                            {showServerOnly && (
                                <Form.Root
                                    style={{ padding: "var(--cpd-space-5x)" }}
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        await loginViewModel.checkHomeserverAndContinue();
                                    }}
                                >
                                    <Form.Field name="server">
                                        <Form.Label>Homeserver</Form.Label>
                                        <Form.TextControl
                                            disabled={checking}
                                            value={server}
                                            placeholder="matrix.org"
                                            onChange={(e) =>
                                                loginViewModel.setServer(
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Form.Field>

                                    {error && (
                                        <div
                                            style={{
                                                color: "var(--cpd-color-text-critical-primary)",
                                                marginBottom:
                                                    "var(--cpd-space-4x)",
                                            }}
                                        >
                                            {error}
                                        </div>
                                    )}

                                    <Form.Submit disabled={!server || checking}>
                                        {checking ? (
                                            <InlineSpinner />
                                        ) : (
                                            "Continue"
                                        )}
                                    </Form.Submit>
                                </Form.Root>
                            )}

                            {showOidcFlow && (
                                <Form.Root
                                    style={{ padding: "var(--cpd-space-5x)" }}
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        loginViewModel.loginWithOidc();
                                    }}
                                >
                                    <Form.Field name="server">
                                        <Form.Label>Homeserver</Form.Label>
                                        <Form.TextControl
                                            disabled={true}
                                            value={server}
                                        />
                                    </Form.Field>

                                    {error && (
                                        <div
                                            style={{
                                                color: "var(--cpd-color-text-critical-primary)",
                                                marginBottom:
                                                    "var(--cpd-space-4x)",
                                            }}
                                        >
                                            {error}
                                        </div>
                                    )}

                                    <Form.Submit
                                        size="lg"
                                        style={{ width: "100%" }}
                                        disabled={loggingIn}
                                    >
                                        {loggingIn ? (
                                            <InlineSpinner />
                                        ) : (
                                            "Continue"
                                        )}
                                    </Form.Submit>

                                    <Button
                                        kind="tertiary"
                                        size="sm"
                                        style={{
                                            width: "100%",
                                            marginTop: "var(--cpd-space-2x)",
                                        }}
                                        disabled={loggingIn}
                                        onClick={() =>
                                            loginViewModel.changeServer()
                                        }
                                    >
                                        Change server
                                    </Button>
                                </Form.Root>
                            )}

                            {showPasswordForm && (
                                <Form.Root
                                    style={{ padding: "var(--cpd-space-5x)" }}
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        await loginViewModel.login();
                                    }}
                                >
                                    <Form.Field name="server">
                                        <Form.Label>Homeserver</Form.Label>
                                        <Form.TextControl
                                            disabled={true}
                                            value={server}
                                        />
                                    </Form.Field>

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

                                    {error && (
                                        <div
                                            style={{
                                                color: "var(--cpd-color-text-critical-primary)",
                                                marginBottom:
                                                    "var(--cpd-space-4x)",
                                            }}
                                        >
                                            {error}
                                        </div>
                                    )}

                                    <Form.Submit disabled={!canSubmit}>
                                        {loggingIn ? (
                                            <InlineSpinner />
                                        ) : (
                                            "Login"
                                        )}
                                    </Form.Submit>

                                    <Button
                                        kind="tertiary"
                                        size="sm"
                                        style={{
                                            width: "100%",
                                            marginTop: "var(--cpd-space-2x)",
                                        }}
                                        disabled={loggingIn}
                                        onClick={() =>
                                            loginViewModel.changeServer()
                                        }
                                    >
                                        Change server
                                    </Button>
                                </Form.Root>
                            )}
                        </TooltipProvider>
                    </div>
                </Glass>
            </div>
        </div>
    );
};
