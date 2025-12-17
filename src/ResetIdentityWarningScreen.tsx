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
import CheckIcon from "@vector-im/compound-design-tokens/assets/web/icons/check";
import InfoIcon from "@vector-im/compound-design-tokens/assets/web/icons/info";
import styles from "./ResetIdentityWarningScreen.module.css";

export interface ResetIdentityWarningScreenProps {
    encryptionViewModel: EncryptionViewModel;
}

export const ResetIdentityWarningScreen: React.FC<
    ResetIdentityWarningScreenProps
> = ({ encryptionViewModel }) => {
    const { error, isResetting } = useViewModel(encryptionViewModel);

    const handleConfirm = async () => {
        try {
            await encryptionViewModel.confirmReset();
        } catch (e) {
            console.error("Failed to reset identity:", e);
        }
    };

    return (
        <div className={styles.container}>
            {/* List of what happens when resetting */}
            <div className={styles.infoBox}>
                <div className={styles.infoItem}>
                    <CheckIcon
                        className={`${styles.icon} ${styles.iconSuccess}`}
                    />
                    <span className={styles.infoText}>
                        Your account details, contacts, preferences, and chat
                        list will be kept
                    </span>
                </div>

                <div className={styles.infoItem}>
                    <InfoIcon className={`${styles.icon} ${styles.iconInfo}`} />
                    <span className={styles.infoText}>
                        You will lose any message history that's stored only on
                        the server
                    </span>
                </div>

                <div className={styles.infoItem}>
                    <InfoIcon className={`${styles.icon} ${styles.iconInfo}`} />
                    <span className={styles.infoText}>
                        You will need to verify all your existing devices and
                        contacts again
                    </span>
                </div>
            </div>

            <p className={styles.warning}>
                Only reset your identity if you don't have access to another
                signed-in device and you've lost your recovery key.
            </p>

            {error && <p className={styles.error}>{error}</p>}

            {isResetting && (
                <div className={styles.loadingContainer}>
                    <InlineSpinner />
                    <span className={styles.loadingText}>
                        Preparing reset...
                    </span>
                </div>
            )}

            <Button
                kind="primary"
                size="lg"
                destructive={true}
                onClick={handleConfirm}
                disabled={isResetting}
            >
                Continue Reset
            </Button>
        </div>
    );
};
