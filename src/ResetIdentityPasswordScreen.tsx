/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { useState } from "react";
import { useViewModel } from "@element-hq/web-shared-components";
import type { EncryptionViewModel } from "./viewmodel/EncryptionViewModel";
import { InlineSpinner } from "@vector-im/compound-web";

interface ResetIdentityPasswordScreenProps {
    encryptionViewModel: EncryptionViewModel;
}

export function ResetIdentityPasswordScreen({
    encryptionViewModel,
}: ResetIdentityPasswordScreenProps) {
    const [password, setPassword] = useState("");
    const { error, isResetting } = useViewModel(encryptionViewModel);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;
        await encryptionViewModel.confirmResetWithPassword(password);
    };

    const handleBack = () => {
        encryptionViewModel.goBack();
    };

    return (
        <div className="encryption-reset-password-screen">
            <div className="content">
                <form onSubmit={handleSubmit}>
                    <div className="password-section">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isResetting}
                            // biome-ignore lint/a11y/noAutofocus: Password field should be focused on mount for better UX
                            autoFocus
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="button-group">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={handleBack}
                            disabled={isResetting}
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            className="destructive-button"
                            disabled={!password.trim() || isResetting}
                        >
                            {isResetting ? (
                                <>
                                    <InlineSpinner />
                                    Resetting...
                                </>
                            ) : (
                                "Reset Identity"
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .encryption-reset-password-screen {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }

                .encryption-reset-password-screen .content {
                    max-width: 480px;
                    width: 100%;
                    text-align: center;
                }

                .encryption-reset-password-screen form {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .encryption-reset-password-screen .password-section {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    text-align: left;
                }

                .encryption-reset-password-screen label {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--cpd-color-text-primary);
                }

                .encryption-reset-password-screen input[type="password"] {
                    padding: 12px 16px;
                    font-size: 16px;
                    border: none;
                    border-radius: 8px;
                    background: var(--cpd-color-bg-subtle-secondary);
                    color: var(--cpd-color-text-primary);
                    outline: none;
                }

                .encryption-reset-password-screen input[type="password"]:focus {
                    outline: 2px solid var(--cpd-color-border-focused);
                    outline-offset: 2px;
                }

                .encryption-reset-password-screen input[type="password"]:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .encryption-reset-password-screen .error-message {
                    padding: 12px 16px;
                    background: var(--cpd-color-bg-critical-subtle);
                    color: var(--cpd-color-text-critical-primary);
                    border-radius: 8px;
                    font-size: 14px;
                    text-align: left;
                }

                .encryption-reset-password-screen .button-group {
                    display: flex;
                    gap: 12px;
                    margin-top: 8px;
                }

                .encryption-reset-password-screen button {
                    flex: 1;
                    padding: 12px 24px;
                    font-size: 16px;
                    font-weight: 600;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: opacity 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .encryption-reset-password-screen button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .encryption-reset-password-screen .secondary-button {
                    background: var(--cpd-color-bg-subtle-secondary);
                    color: var(--cpd-color-text-primary);
                }

                .encryption-reset-password-screen .secondary-button:hover:not(:disabled) {
                    background: var(--cpd-color-bg-subtle-secondary);
                    opacity: 0.9;
                }

                .encryption-reset-password-screen .destructive-button {
                    background: var(--cpd-color-bg-critical-primary);
                    color: var(--cpd-color-text-on-solid-primary);
                }

                .encryption-reset-password-screen .destructive-button:hover:not(:disabled) {
                    opacity: 0.9;
                }
            `}</style>
        </div>
    );
}
