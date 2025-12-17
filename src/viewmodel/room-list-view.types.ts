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
import type { RoomSummary } from "./RoomSummary";
import type {
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

export interface RoomSection {
    name: string;
    rooms: Array<RoomSummary>;
    expanded: boolean;
}

/**
 * Snapshot represents the complete state of the room list view
 */
export interface RoomListViewSnapshot {
    /** List of room summaries */
    rooms: Array<RoomSummary>;

    /** Room sections (Favourites, Other, Low Priority) */
    sections: Array<RoomSection>;

    /** Currently selected filter */
    selectedFilter: SupportedFilters;

    /** Available filters for the room list */
    filters: FilterInfo[];

    /** Whether the room list is currently loading */
    loading: boolean;

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

    /**
     * Toggle a section's expanded state
     */
    toggleSection(index: number): void;
}
