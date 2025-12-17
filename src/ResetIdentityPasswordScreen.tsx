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
import styles from "./ResetIdentityPasswordScreen.module.css";

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
        <div className={styles.screen}>
            <div className={styles.content}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.passwordSection}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isResetting}
                            className={styles.passwordInput}
                            // biome-ignore lint/a11y/noAutofocus: Password field should be focused on mount for better UX
                            autoFocus
                        />
                    </div>

                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <div className={styles.buttonGroup}>
                        <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={handleBack}
                            disabled={isResetting}
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            className={styles.destructiveButton}
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
        </div>
    );
}
