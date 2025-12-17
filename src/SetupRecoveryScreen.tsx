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
import styles from "./SetupRecoveryScreen.module.css";

export interface SetupRecoveryScreenProps {
    encryptionViewModel: EncryptionViewModel;
}

export const SetupRecoveryScreen: React.FC<SetupRecoveryScreenProps> = ({
    encryptionViewModel,
}) => {
    return (
        <div className={styles.container}>
            <Button
                kind="primary"
                size="lg"
                onClick={async () => await encryptionViewModel.enableRecovery()}
            >
                Generate your recovery key
            </Button>
        </div>
    );
};
