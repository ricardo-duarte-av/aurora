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
import { useState } from "react";
import type { EncryptionViewModel } from "./viewmodel/EncryptionViewModel";
import CheckIcon from "@vector-im/compound-design-tokens/assets/web/icons/check";
import CopyIcon from "@vector-im/compound-design-tokens/assets/web/icons/copy";
import styles from "./SaveRecoveryKeyScreen.module.css";

export interface SaveRecoveryKeyScreenProps {
    encryptionViewModel: EncryptionViewModel;
}

export const SaveRecoveryKeyScreen: React.FC<SaveRecoveryKeyScreenProps> = ({
    encryptionViewModel,
}) => {
    const { recoveryKey } = useViewModel(encryptionViewModel);
    const [copied, setCopied] = useState(false);

    const handleCopyRecoveryKey = async () => {
        if (recoveryKey) {
            await navigator.clipboard.writeText(recoveryKey);
            setCopied(true);
            // Reset after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDismissRecoveryKey = () => {
        encryptionViewModel.dismissRecoveryKey();
    };

    return (
        <div className={styles.container}>
            <div className={styles.recoveryKeyBox}>{recoveryKey}</div>

            <div className={styles.actions}>
                <Button
                    kind="secondary"
                    size="lg"
                    onClick={handleCopyRecoveryKey}
                >
                    {copied ? (
                        <>
                            <CheckIcon className={styles.checkIcon} />
                            Copied!
                        </>
                    ) : (
                        <>
                            <CopyIcon className={styles.checkIcon} />
                            Copy recovery key
                        </>
                    )}
                </Button>
                <Button
                    kind="primary"
                    size="lg"
                    onClick={handleDismissRecoveryKey}
                >
                    I've Saved It
                </Button>
            </div>
        </div>
    );
};
