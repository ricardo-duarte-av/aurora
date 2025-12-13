import { Form, InlineSpinner } from "@vector-im/compound-web";
import { useViewModel } from "@element-hq/web-shared-components";
import type React from "react";
import type { LoginViewModel } from "./viewmodel/LoginViewModel";
import HostIcon from "@vector-im/compound-design-tokens/assets/web/icons/host";

export interface ServerInputScreenProps {
    loginViewModel: LoginViewModel;
}

export const ServerInputScreen: React.FC<ServerInputScreenProps> = ({
    loginViewModel,
}) => {
    const { server, checking, error } = useViewModel(loginViewModel);

    return (
        <Form.Root
            style={{ padding: "var(--cpd-space-5x)" }}
            onSubmit={async (e) => {
                e.preventDefault();
                await loginViewModel.checkCapabilitiesAndContinue();
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
                    <HostIcon
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
                    Select your server
                </h2>

                <p
                    style={{
                        textAlign: "center",
                        margin: 0,
                        color: "var(--cpd-color-text-secondary)",
                    }}
                >
                    What is the address of your server?
                </p>
            </div>

            <Form.Field name="server">
                <Form.Label>Homeserver URL</Form.Label>
                <Form.TextControl
                    disabled={checking}
                    value={server}
                    placeholder="matrix.org"
                    onChange={(e) => loginViewModel.setServer(e.target.value)}
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

            <Form.Submit disabled={!server || checking}>
                {checking ? <InlineSpinner /> : "Continue"}
            </Form.Submit>
        </Form.Root>
    );
};
