import { Button, Form, InlineSpinner } from "@vector-im/compound-web";
import { useViewModel } from "@element-hq/web-shared-components";
import type React from "react";
import type { LoginViewModel } from "./viewmodel/LoginViewModel";

export interface UsernamePasswordScreenProps {
    loginViewModel: LoginViewModel;
}

export const UsernamePasswordScreen: React.FC<
    UsernamePasswordScreenProps
> = ({ loginViewModel }) => {
    const { server, username, password, canSubmit, loggingIn, error } =
        useViewModel(loginViewModel);

    return (
        <Form.Root
            style={{ padding: "var(--cpd-space-5x)" }}
            onSubmit={async (e) => {
                e.preventDefault();
                await loginViewModel.login();
            }}
        >
            <Form.Field name="server">
                <Form.Label>Homeserver</Form.Label>
                <Form.TextControl disabled={true} value={server} />
            </Form.Field>

            <Form.Field name="username">
                <Form.Label>Username</Form.Label>
                <Form.TextControl
                    disabled={loggingIn}
                    value={username}
                    onChange={(e) => loginViewModel.setUsername(e.target.value)}
                />
            </Form.Field>

            <Form.Field name="password">
                <Form.Label>Password</Form.Label>
                <Form.PasswordControl
                    disabled={loggingIn}
                    value={password}
                    onChange={(e) => loginViewModel.setPassword(e.target.value)}
                />
            </Form.Field>

            {error && (
                <div
                    style={{
                        color: "var(--cpd-color-text-critical-primary)",
                        marginBottom: "var(--cpd-space-4x)",
                    }}
                >
                    {error}
                </div>
            )}

            <Form.Submit disabled={!canSubmit}>
                {loggingIn ? <InlineSpinner /> : "Login"}
            </Form.Submit>

            <Button
                kind="tertiary"
                size="sm"
                style={{
                    width: "100%",
                    marginTop: "var(--cpd-space-2x)",
                }}
                disabled={loggingIn}
                onClick={() => loginViewModel.changeServer()}
            >
                Change account provider
            </Button>
        </Form.Root>
    );
};
