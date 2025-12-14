/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import type React from "react";

export const RecoveryCompleteScreen: React.FC = () => {
    return (
        <p
            style={{
                textAlign: "center",
                margin: 0,
                color: "var(--cpd-color-text-secondary)",
            }}
        >
            ✓ Recovery is enabled. Your messages are backed up securely.
        </p>
    );
};
