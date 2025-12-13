/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import type React from "react";
import { useEffect } from "react";

/**
 * OIDC Callback Handler Component
 * This component is rendered when the OAuth provider redirects back to the app
 * It extracts the callback URL and immediately sends it to the parent window
 */
export const OidcCallback: React.FC = () => {
    useEffect(() => {
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

            // Close the popup immediately
            window.close();
        } else {
            // No opener - log error but don't block
            console.error(
                "No parent window found. OIDC login must be initiated from the main window.",
            );
        }
    }, []);

    // Render nothing - the window will close immediately
    return null;
};
