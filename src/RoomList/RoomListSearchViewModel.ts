/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import {
    BaseViewModel,
    type RoomListSearchViewSnapshot,
    type RoomListSearchViewModel as RoomListSearchViewModelInterface,
} from "@element-hq/web-shared-components";

export class RoomListSearchViewModel
    extends BaseViewModel<RoomListSearchViewSnapshot, null>
    implements RoomListSearchViewModelInterface
{
    constructor() {
        super(null, {
            displayDialButton: true,
            displayExploreButton: true,
            searchShortcut: "⌘ K",
        });
    }

    onSearchClick(): void {
        // Implement search click handling logic here
    }

    onExploreClick(): void {
        // Implement explore click handling logic here
    }

    onDialPadClick(): void {
        // Implement dial pad click handling logic here
    }
}
