/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { InlineSpinner } from "@vector-im/compound-web";
import { useViewModel } from "@element-hq/web-shared-components";
import type React from "react";
import type { EncryptionViewModel } from "./viewmodel/EncryptionViewModel";
import styles from "./EnablingRecoveryScreen.module.css";

export interface EnablingRecoveryScreenProps {
    encryptionViewModel: EncryptionViewModel;
}

export const EnablingRecoveryScreen: React.FC<EnablingRecoveryScreenProps> = ({
    encryptionViewModel,
}) => {
    const { enableRecoveryProgress } = useViewModel(encryptionViewModel);

    return (
        <div className={styles.container}>
            <InlineSpinner />
            <p className={styles.progressText}>{enableRecoveryProgress}</p>
        </div>
    );
};
