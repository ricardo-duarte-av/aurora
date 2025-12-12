/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { BaseViewModel } from "@element-hq/web-shared-components";
import type {
    LoginViewActions,
    LoginViewSnapshot,
    Props,
} from "./login-view.types";

export class LoginViewModel
    extends BaseViewModel<LoginViewSnapshot, Props>
    implements LoginViewActions
{
    public constructor(props: Props) {
        super(props, {
            username: "",
            password: "",
            server: "matrix.org",
            canSubmit: false,
            loggingIn: false,
            error: null,
            checking: false,
            supportsOidc: null,
            supportsPassword: null,
        });

        // Automatically check capabilities for default server
        this.checkHomeserverAndContinue();
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
                server: `https://${server}`,
            });
        } catch (e) {
            console.error("Password login error:", e);
            this.snapshot.merge({
                error: e instanceof Error ? e.message : "Login failed",
            });
        }
    }

    public async checkHomeserverAndContinue(): Promise<void> {
        const { server } = this.getSnapshot();
        if (!server) return;

        this.snapshot.merge({ checking: true, error: null });

        try {
            const loginDetails = await this.props.onCheckHomeserver(
                `https://${server}`,
            );

            const oidcSupported = loginDetails.supportsOidcLogin();
            const passwordSupported = loginDetails.supportsPasswordLogin();

            console.log("Homeserver capabilities:", {
                oidc: oidcSupported,
                password: passwordSupported,
            });

            // If OIDC is supported, use it (regardless of password support)
            if (oidcSupported) {
                this.snapshot.merge({
                    supportsOidc: true,
                    supportsPassword: passwordSupported,
                    checking: false,
                });
            } else {
                // Only show password form if OIDC is not supported
                this.snapshot.merge({
                    supportsOidc: false,
                    supportsPassword: passwordSupported,
                    checking: false,
                });
            }
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
            const homeserverUrl = `https://${server}`;
            const authData = await this.props.onGetOidcAuthUrl(
                homeserverUrl,
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

            // Listen for the callback from the popup
            const handleMessage = async (event: MessageEvent) => {
                if (event.origin !== window.location.origin) {
                    return;
                }

                if (event.data?.type === "oidc-callback") {
                    window.removeEventListener("message", handleMessage);
                    await this.completeOidcLogin(event.data.callbackUrl);
                }
            };

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
            await this.props.onLoginWithOidcCallback(
                callbackUrl,
                `https://${server}`,
            );
        } catch (e) {
            console.error("OIDC callback error:", e);
            this.snapshot.merge({
                error:
                    e instanceof Error
                        ? e.message
                        : "Failed to complete OIDC login",
            });
        }
    }

    public usePasswordInstead(): void {
        // Keep password support but disable OIDC to show password form
        this.snapshot.merge({ supportsOidc: false });
    }

    public changeServer(): void {
        this.snapshot.merge({
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
