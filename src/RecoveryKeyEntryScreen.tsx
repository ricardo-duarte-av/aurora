/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { Form } from "@vector-im/compound-web";
import { useViewModel } from "@element-hq/web-shared-components";
import type React from "react";
import { useState } from "react";
import type { EncryptionViewModel } from "./viewmodel/EncryptionViewModel";

export interface RecoveryKeyEntryScreenProps {
    encryptionViewModel: EncryptionViewModel;
}

export const RecoveryKeyEntryScreen: React.FC<RecoveryKeyEntryScreenProps> = ({
    encryptionViewModel,
}) => {
    const { error, isVerifying } = useViewModel(encryptionViewModel);
    const [recoveryKeyInput, setRecoveryKeyInput] = useState("");

    const handleRecover = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await encryptionViewModel.recover(recoveryKeyInput);
            setRecoveryKeyInput("");
        } catch (err) {
            // Error is handled in the view model
        }
    };

    return (
        <div style={{ width: "100%", boxSizing: "border-box" }}>
            {error && (
                <div
                    style={{
                        color: "var(--cpd-color-text-critical-primary)",
                        marginBottom: "var(--cpd-space-4x)",
                        textAlign: "center",
                    }}
                >
                    {error}
                </div>
            )}

            <Form.Root onSubmit={handleRecover}>
                <Form.Field name="recoveryKey">
                    <Form.Label>Recovery Key</Form.Label>
                    <Form.TextControl
                        type="password"
                        value={recoveryKeyInput}
                        placeholder="Enter your recovery key"
                        onChange={(e) => setRecoveryKeyInput(e.target.value)}
                        disabled={isVerifying}
                    />
                </Form.Field>

                <Form.Submit disabled={!recoveryKeyInput.trim() || isVerifying}>
                    {isVerifying ? "Verifying..." : "Continue"}
                </Form.Submit>
            </Form.Root>
        </div>
    );
};
