/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { Button } from "@vector-im/compound-web";
import { useViewModel } from "@element-hq/web-shared-components";
import type React from "react";
import type { EncryptionViewModel } from "./viewmodel/EncryptionViewModel";

export interface SaveRecoveryKeyScreenProps {
    encryptionViewModel: EncryptionViewModel;
}

export const SaveRecoveryKeyScreen: React.FC<SaveRecoveryKeyScreenProps> = ({
    encryptionViewModel,
}) => {
    const { recoveryKey } = useViewModel(encryptionViewModel);

    const handleCopyRecoveryKey = () => {
        if (recoveryKey) {
            navigator.clipboard.writeText(recoveryKey);
        }
    };

    const handleDismissRecoveryKey = () => {
        encryptionViewModel.dismissRecoveryKey();
    };

    return (
        <div style={{ width: "100%", boxSizing: "border-box" }}>
            <p
                style={{
                    textAlign: "center",
                    margin: 0,
                    marginBottom: "var(--cpd-space-4x)",
                    color: "var(--cpd-color-text-secondary)",
                }}
            >
                Your recovery key has been created. Please save it in a safe
                place. You'll need it to recover your encrypted messages if you
                lose access to all your devices.
            </p>

            <div
                style={{
                    backgroundColor: "var(--cpd-color-bg-subtle-secondary)",
                    padding: "var(--cpd-space-4x)",
                    borderRadius: "var(--cpd-radius-pill-effect)",
                    marginBottom: "var(--cpd-space-4x)",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    boxSizing: "border-box",
                }}
            >
                {recoveryKey}
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--cpd-space-2x)",
                }}
            >
                <Button kind="secondary" size="lg" onClick={handleCopyRecoveryKey}>
                    Copy to Clipboard
                </Button>
                <Button kind="primary" size="lg" onClick={handleDismissRecoveryKey}>
                    I've Saved It
                </Button>
            </div>
        </div>
    );
};
