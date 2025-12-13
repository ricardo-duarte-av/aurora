import { Button, Form, InlineSpinner } from "@vector-im/compound-web";
import { useViewModel } from "@element-hq/web-shared-components";
import type React from "react";
import type { LoginViewModel } from "./viewmodel/LoginViewModel";
import UserProfileSolidIcon from "@vector-im/compound-design-tokens/assets/web/icons/user-profile-solid";

export interface OidcLoginScreenProps {
    loginViewModel: LoginViewModel;
}

export const OidcLoginScreen: React.FC<OidcLoginScreenProps> = ({
    loginViewModel,
}) => {
    const { server, loggingIn, error } = useViewModel(loginViewModel);

    return (
        <Form.Root
            style={{ padding: "var(--cpd-space-5x)" }}
            onSubmit={(e) => {
                e.preventDefault();
                loginViewModel.loginWithOidc();
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "var(--cpd-space-2x)",
                    marginBottom: "var(--cpd-space-9x)",
                }}
            >
                <div
                    style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "14px",
                        backgroundColor: "var(--cpd-color-bg-subtle-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "var(--cpd-space-2x)",
                    }}
                >
                    <UserProfileSolidIcon
                        width="32px"
                        height="32px"
                        style={{
                            color: "var(--cpd-color-icon-secondary)",
                        }}
                    />
                </div>

                <h2
                    style={{
                        textAlign: "center",
                        margin: 0,
                        fontSize: "var(--cpd-font-size-heading-md)",
                        fontWeight: "var(--cpd-font-weight-semibold)",
                    }}
                >
                    You're about to sign in to {server}
                </h2>

                <p
                    style={{
                        textAlign: "center",
                        margin: 0,
                        color: "var(--cpd-color-text-secondary)",
                    }}
                >
                    Matrix is an open network for secure, decentralised
                    communication.
                </p>
            </div>

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

            <Form.Submit
                size="lg"
                style={{ width: "100%" }}
                disabled={loggingIn}
            >
                {loggingIn ? <InlineSpinner /> : "Continue"}
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
