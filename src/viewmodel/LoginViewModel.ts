/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { BaseViewModel } from "@element-hq/web-shared-components";
import {
    LoginFlow,
    type LoginViewActions,
    type LoginViewSnapshot,
    type Props,
} from "./login-view.types";

export class LoginViewModel
    extends BaseViewModel<LoginViewSnapshot, Props>
    implements LoginViewActions
{
    public constructor(props: Props) {
        super(props, {
            flow: LoginFlow.ServerInput,
            username: "",
            password: "",
            server: "matrix.org",
            canSubmit: false,
            loggingIn: false,
            error: null,
            checking: false,
            supportsOidc: true,
            supportsPassword: null,
        });
    }

    public setUsername(username: string): void {
        const snapshot = this.getSnapshot();
        this.snapshot.merge({
            username,
            canSubmit: this.validateForm(
                username,
                snapshot.password,
                snapshot.server,
            ),
        });
    }

    public setPassword(password: string): void {
        const snapshot = this.getSnapshot();
        this.snapshot.merge({
            password,
            canSubmit: this.validateForm(
                snapshot.username,
                password,
                snapshot.server,
            ),
        });
    }

    public setServer(server: string): void {
        const snapshot = this.getSnapshot();
        this.snapshot.merge({
            server,
            canSubmit: this.validateForm(
                snapshot.username,
                snapshot.password,
                server,
            ),
        });
    }

    public async login(): Promise<void> {
        const { username, password, server } = this.getSnapshot();
        try {
            this.snapshot.merge({ error: null });
            await this.props.onLogin({
                username,
                password,
                server,
            });
        } catch (e) {
            console.error("Password login error:", e);
            this.snapshot.merge({
                error: e instanceof Error ? e.message : "Login failed",
            });
        }
    }

    public async checkCapabilitiesAndContinue(): Promise<void> {
        const { server } = this.getSnapshot();
        if (!server) return;

        this.snapshot.merge({ checking: true, error: null });

        try {
            const loginDetails = await this.props.onCheckHomeserver(server);

            const oidcSupported = loginDetails.supportsOidcLogin();
            const passwordSupported = loginDetails.supportsPasswordLogin();

            console.log("Homeserver capabilities:", {
                oidc: oidcSupported,
                password: passwordSupported,
            });

            // Determine which flow to transition to
            let nextFlow: LoginFlow;
            if (oidcSupported) {
                nextFlow = LoginFlow.OIDC;
            } else if (passwordSupported) {
                nextFlow = LoginFlow.UsernamePassword;
            } else {
                // No supported login methods
                throw new Error("No supported login methods available");
            }

            this.snapshot.merge({
                flow: nextFlow,
                supportsOidc: oidcSupported,
                supportsPassword: passwordSupported,
                checking: false,
            });
        } catch (e) {
            console.error("Failed to check homeserver capabilities:", e);
            this.snapshot.merge({
                error:
                    e instanceof Error
                        ? e.message
                        : "Failed to connect to homeserver",
                checking: false,
            });
        }
    }

    public async loginWithOidc(): Promise<void> {
        const { server, username } = this.getSnapshot();
        try {
            this.snapshot.merge({ error: null });
            const authData = await this.props.onGetOidcAuthUrl(
                server,
                username || undefined,
            );

            // Get the login URL
            const loginUrl = authData.loginUrl();
            console.log("Opening OIDC login URL:", loginUrl);

            // Open OIDC provider in a popup window
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const popup = window.open(
                loginUrl,
                "oidc-login",
                `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`,
            );

            if (!popup) {
                throw new Error(
                    "Failed to open popup window. Please allow popups for this site.",
                );
            }

            // Track whether login completed successfully
            let loginCompleted = false;

            // Clean up event listeners and intervals
            const cleanup = () => {
                window.removeEventListener("message", handleMessage);
                clearInterval(popupChecker);
            };

            // Listen for the callback from the popup
            const handleMessage = async (event: MessageEvent) => {
                if (event.origin !== window.location.origin) {
                    return;
                }

                if (event.data?.type === "oidc-callback") {
                    loginCompleted = true;
                    cleanup();
                    await this.completeOidcLogin(event.data.callbackUrl);
                }
            };

            // Check if popup was closed (user cancelled)
            const popupChecker = setInterval(async () => {
                if (popup.closed) {
                    cleanup();
                    if (!loginCompleted) {
                        console.log("OIDC popup closed - user cancelled login");
                        await this.props.onAbortOidcLogin();
                    }
                }
            }, 500);

            window.addEventListener("message", handleMessage);
        } catch (e) {
            console.error("OIDC login error:", e);
            this.snapshot.merge({
                error:
                    e instanceof Error
                        ? e.message
                        : "Failed to start OIDC login",
            });
        }
    }

    public async completeOidcLogin(callbackUrl: string): Promise<void> {
        const { server } = this.getSnapshot();
        try {
            this.snapshot.merge({ error: null });
            await this.props.onLoginWithOidcCallback(callbackUrl, server);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);

            // Check if this is a user cancellation error
            if (errorMessage.includes("OidcError.Cancelled")) {
                console.log("OIDC login cancelled by user");
                // Call abort to clean up the state
                await this.props.onAbortOidcLogin();
                return;
            }

            // This is an actual error, not a user cancellation
            console.error("OIDC callback error:", e);
            this.snapshot.merge({
                error: errorMessage || "Failed to complete OIDC login",
            });
        }
    }

    public usePasswordInstead(): void {
        // Transition to password login flow
        this.snapshot.merge({ flow: LoginFlow.UsernamePassword });
    }

    public changeServer(): void {
        // Go back to server input
        this.snapshot.merge({
            flow: LoginFlow.ServerInput,
            supportsOidc: null,
            supportsPassword: null,
            error: null,
        });
    }

    public setLoggingIn(loggingIn: boolean): void {
        this.snapshot.merge({ loggingIn });
    }

    private validateForm(
        username: string,
        password: string,
        server: string,
    ): boolean {
        return Boolean(username && password && server);
    }
}
