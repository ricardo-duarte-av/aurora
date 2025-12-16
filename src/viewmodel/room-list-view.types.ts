/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import type { ListRange } from "react-virtuoso";
import type { SupportedFilters } from "../Filter";
import type { RoomItemViewModel } from "./RoomListItemViewModel";
import type {
    RoomListLoadingState,
    RoomListServiceInterface,
    SyncServiceInterface,
} from "../index.web";

/**
 * Props passed to RoomListViewModel constructor
 */
export interface Props {
    syncServiceInterface: SyncServiceInterface;
    roomListService: RoomListServiceInterface;
}

export interface FilterInfo {
    active: boolean;
    name: string;
    key: SupportedFilters;
}

/**
 * Snapshot represents the complete state of the room list view
 */
export interface RoomListViewSnapshot {
    /** List of room list items */
    rooms: Array<RoomItemViewModel>;

    /** Total number of rooms available */
    numRooms: number;

    /** Currently selected filter */
    selectedFilter: SupportedFilters;

    /** Current loading state */
    loadingState?: RoomListLoadingState;

    /** Available filters for the room list */
    filters: FilterInfo[];

    /** Whether more rooms can be loaded via pagination */
    canLoadMore: boolean;

    /** Currently active room ID */
    currentRoomId?: string;
}

/**
 * Actions that views can call on the RoomListViewModel
 */
export interface RoomListViewActions {
    /**
     * Set the active room for subscription
     */
    setActiveRoom(roomId: string): void;

    /**
     * Handle visible range changes for room subscription
     */
    rangeChanged(range: ListRange): void;

    /**
     * Load more rooms
     */
    loadMore(): void;

    /**
     * Toggle a filter
     */
    toggleFilter(filter: SupportedFilters): void;

    /**
     * Check if the 'All' filter is active
     */
    isAllFilter(): boolean;
}
