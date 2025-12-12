/*
 * Copyright 2025 New Vector Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import { ChatFilter } from "@vector-im/compound-web";
import type { JSX } from "react";
import { useViewModel } from "@element-hq/web-shared-components";
import "./RoomListFiltersView.css";

import type { RoomListViewModel } from "./viewmodel/RoomListViewModel";
import { Flex } from "./utils/Flex";

interface RoomListFiltersViewProps {
    vm: RoomListViewModel;
}

/**
 * The primary filters for the room list
 */
export function RoomListFiltersView({
    vm,
}: RoomListFiltersViewProps): JSX.Element {
    const { filters } = useViewModel(vm);

    return (
        <Flex
            as="ul"
            role="listbox"
            className="mx_RoomListFilters"
            align="center"
            gap="var(--cpd-space-2x)"
            wrap="wrap"
        >
            {filters.map((filter) => (
                <li
                    role="option"
                    aria-selected={filter.active}
                    key={filter.name}
                >
                    <ChatFilter
                        selected={filter.active}
                        onClick={() => vm.toggleFilter(filter.key)}
                    >
                        {filter.name}
                    </ChatFilter>
                </li>
            ))}
        </Flex>
    );
}
