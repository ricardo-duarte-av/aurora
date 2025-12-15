/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { Button, InlineSpinner } from "@vector-im/compound-web";
import { useViewModel } from "@element-hq/web-shared-components";
import type React from "react";
import type { EncryptionViewModel } from "./viewmodel/EncryptionViewModel";
import { IdentityConfirmationAction } from "./viewmodel/encryption-view.types";

export interface ConfirmIdentityScreenProps {
    encryptionViewModel: EncryptionViewModel;
}

export const ConfirmIdentityScreen: React.FC<ConfirmIdentityScreenProps> = ({
    encryptionViewModel,
}) => {
    const { availableActions } = useViewModel(encryptionViewModel);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--cpd-space-3x)",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <p
                style={{
                    textAlign: "center",
                    margin: 0,
                    marginBottom: "var(--cpd-space-2x)",
                    color: "var(--cpd-color-text-secondary)",
                }}
            >
                Confirm your identity to set up secure messaging.
            </p>

            {availableActions === undefined ? (
                <Button kind="primary" size="lg" disabled={true}>
                    <InlineSpinner />
                    Loading...
                </Button>
            ) : (
                <>
                    {availableActions.includes(IdentityConfirmationAction.InteractiveVerification) && (
                        <Button
                            kind="primary"
                            size="lg"
                            disabled={true}
                        >
                            Use another device
                        </Button>
                    )}

                    {availableActions.includes(IdentityConfirmationAction.Recovery) && (
                        <Button
                            kind="primary"
                            size="lg"
                            onClick={() => encryptionViewModel.useRecoveryKey()}
                        >
                            Use recovery key
                        </Button>
                    )}

                    <Button
                        kind="secondary"
                        size="lg"
                        onClick={() => encryptionViewModel.showResetWarning()}
                    >
                        Can't confirm
                    </Button>
                </>
            )}
        </div>
    );
};
