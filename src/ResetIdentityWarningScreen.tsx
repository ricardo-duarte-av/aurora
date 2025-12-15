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
import CheckIcon from "@vector-im/compound-design-tokens/assets/web/icons/check";
import InfoIcon from "@vector-im/compound-design-tokens/assets/web/icons/info";

export interface ResetIdentityWarningScreenProps {
    encryptionViewModel: EncryptionViewModel;
}

export const ResetIdentityWarningScreen: React.FC<
    ResetIdentityWarningScreenProps
> = ({ encryptionViewModel }) => {
    const { error } = useViewModel(encryptionViewModel);

    const handleConfirm = async () => {
        try {
            await encryptionViewModel.confirmReset();
        } catch (e) {
            console.error("Failed to reset identity:", e);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--cpd-space-4x)",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <p
                style={{
                    textAlign: "center",
                    margin: 0,
                    fontWeight: 600,
                    color: "var(--cpd-color-text-primary)",
                }}
            >
                Can't confirm? You'll need to reset your identity.
            </p>

            {/* List of what happens when resetting */}
            <div
                style={{
                    backgroundColor: "var(--cpd-color-bg-subtle-secondary)",
                    borderRadius: "var(--cpd-radius-md)",
                    padding: "var(--cpd-space-3x)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--cpd-space-2x)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: "var(--cpd-space-2x)",
                        alignItems: "flex-start",
                    }}
                >
                    <CheckIcon
                        style={{
                            width: "20px",
                            height: "20px",
                            color: "var(--cpd-color-icon-accent-primary)",
                            flexShrink: 0,
                            marginTop: "2px",
                        }}
                    />
                    <span
                        style={{
                            fontSize: "14px",
                            color: "var(--cpd-color-text-primary)",
                        }}
                    >
                        Your account details, contacts, preferences, and chat
                        list will be kept
                    </span>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "var(--cpd-space-2x)",
                        alignItems: "flex-start",
                    }}
                >
                    <InfoIcon
                        style={{
                            width: "20px",
                            height: "20px",
                            color: "var(--cpd-color-icon-secondary)",
                            flexShrink: 0,
                            marginTop: "2px",
                        }}
                    />
                    <span
                        style={{
                            fontSize: "14px",
                            color: "var(--cpd-color-text-primary)",
                        }}
                    >
                        You will lose any message history that's stored only on
                        the server
                    </span>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "var(--cpd-space-2x)",
                        alignItems: "flex-start",
                    }}
                >
                    <InfoIcon
                        style={{
                            width: "20px",
                            height: "20px",
                            color: "var(--cpd-color-icon-secondary)",
                            flexShrink: 0,
                            marginTop: "2px",
                        }}
                    />
                    <span
                        style={{
                            fontSize: "14px",
                            color: "var(--cpd-color-text-primary)",
                        }}
                    >
                        You will need to verify all your existing devices and
                        contacts again
                    </span>
                </div>
            </div>

            <p
                style={{
                    textAlign: "center",
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--cpd-color-text-primary)",
                }}
            >
                Only reset your identity if you don't have access to another
                signed-in device and you've lost your recovery key.
            </p>

            {error && (
                <p
                    style={{
                        color: "var(--cpd-color-text-critical-primary)",
                        textAlign: "center",
                        margin: 0,
                    }}
                >
                    {error}
                </p>
            )}

            <Button
                kind="primary"
                size="lg"
                destructive={true}
                onClick={handleConfirm}
            >
                Continue Reset
            </Button>
        </div>
    );
};
