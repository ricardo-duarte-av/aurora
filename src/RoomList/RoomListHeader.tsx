/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import {
    RoomListHeaderView,
    useCreateAutoDisposedViewModel,
} from "@element-hq/web-shared-components";
import { RoomListHeaderViewModel } from "./RoomListHeaderViewModel";

export function RoomListHeader() {
    const vm = useCreateAutoDisposedViewModel(
        () => new RoomListHeaderViewModel(),
    );

    return <RoomListHeaderView vm={vm} />;
}
