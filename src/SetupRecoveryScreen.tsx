/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { Button } from "@vector-im/compound-web";
import type React from "react";
import type { EncryptionViewModel } from "./viewmodel/EncryptionViewModel";

export interface SetupRecoveryScreenProps {
    encryptionViewModel: EncryptionViewModel;
}

export const SetupRecoveryScreen: React.FC<SetupRecoveryScreenProps> = ({
    encryptionViewModel,
}) => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <p
                style={{
                    textAlign: "center",
                    marginBottom: "var(--cpd-space-4x)",
                    color: "var(--cpd-color-text-secondary)",
                }}
            >
                Set up a recovery key to secure your encrypted messages.
            </p>

            <Button
                kind="primary"
                size="lg"
                onClick={async () => await encryptionViewModel.enableRecovery()}
            >
                Set Up Recovery
            </Button>
        </div>
    );
};
