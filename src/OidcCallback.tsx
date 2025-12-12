/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { InlineSpinner } from "@vector-im/compound-web";
import type React from "react";
import { useEffect, useState } from "react";

/**
 * OIDC Callback Handler Component
 * This component is rendered when the OAuth provider redirects back to the app
 * It extracts the callback URL and completes the login flow
 */
export const OidcCallback: React.FC = () => {
    const [status, setStatus] = useState<"processing" | "success" | "error">(
        "processing",
    );
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = () => {
            try {
                // Get the full callback URL
                const callbackUrl = window.location.href;
                console.log("OIDC callback received:", callbackUrl);

                // If we have an opener (popup mode), send the callback URL to it
                if (window.opener && !window.opener.closed) {
                    console.log("Sending callback to opener window");
                    window.opener.postMessage(
                        {
                            type: "oidc-callback",
                            callbackUrl,
                        },
                        window.location.origin,
                    );

                    setStatus("success");

                    // Close the popup after a brief delay
                    setTimeout(() => {
                        window.close();
                    }, 1000);
                } else {
                    // No opener - this shouldn't happen with popup flow
                    // but handle it gracefully
                    throw new Error(
                        "No parent window found. OIDC login must be initiated from the main window.",
                    );
                }
            } catch (e) {
                console.error("OIDC callback error:", e);
                const errorMessage =
                    e instanceof Error ? e.message : "Failed to complete login";
                setError(errorMessage);
                setStatus("error");
            }
        };

        handleCallback();
    }, []);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                padding: "var(--cpd-space-4x)",
                textAlign: "center",
            }}
        >
            {status === "processing" && (
                <>
                    <InlineSpinner />
                    <p style={{ marginTop: "var(--cpd-space-4x)" }}>
                        Completing login...
                    </p>
                </>
            )}

            {status === "success" && (
                <>
                    <div
                        style={{
                            fontSize: "48px",
                            color: "var(--cpd-color-text-success-primary)",
                            marginBottom: "var(--cpd-space-4x)",
                        }}
                    >
                        ✓
                    </div>
                    <h2>Login Successful!</h2>
                    <p style={{ marginTop: "var(--cpd-space-2x)" }}>
                        Redirecting to app...
                    </p>
                </>
            )}

            {status === "error" && (
                <>
                    <div
                        style={{
                            fontSize: "48px",
                            color: "var(--cpd-color-text-critical-primary)",
                            marginBottom: "var(--cpd-space-4x)",
                        }}
                    >
                        ✗
                    </div>
                    <h2>Login Failed</h2>
                    <p
                        style={{
                            marginTop: "var(--cpd-space-2x)",
                            color: "var(--cpd-color-text-critical-primary)",
                        }}
                    >
                        {error}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            window.location.href = "/";
                        }}
                        style={{
                            marginTop: "var(--cpd-space-4x)",
                            padding: "var(--cpd-space-3x)",
                            backgroundColor:
                                "var(--cpd-color-bg-action-primary-rest)",
                            color: "var(--cpd-color-text-on-solid-primary)",
                            border: "none",
                            borderRadius: "var(--cpd-radius-pill-effect)",
                            cursor: "pointer",
                        }}
                    >
                        Back to Login
                    </button>
                </>
            )}
        </div>
    );
};
