/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import { Flex } from "@element-hq/web-shared-components";
import { InlineSpinner } from "@vector-im/compound-web";
import type { PropsWithChildren } from "react";
import styles from "./LoadingScreen.module.css";

export function LoadingScreen({ children }: PropsWithChildren) {
    return (
        <Flex
            className={styles.container}
            direction="column"
            align="center"
            justify="center"
        >
            <InlineSpinner size={32} />
            {children}
        </Flex>
    );
}
