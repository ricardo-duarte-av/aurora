/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { debounce } from "lodash-es";
import type { ListRange } from "react-virtuoso";
import { BaseViewModel } from "@element-hq/web-shared-components";
import { applyDiff } from "../DiffUtils";
import { FILTERS, type SupportedFilters } from "../Filter";
import {
    type RoomInterface,
    type RoomListDynamicEntriesControllerInterface,
    RoomListEntriesDynamicFilterKind_Tags,
    type RoomListEntriesUpdate,
    type RoomListEntriesWithDynamicAdaptersResultInterface,
    RoomListLoadingState,
    type TaskHandleInterface,
} from "../index.web";
import { RoomListItemViewModel } from "./RoomListItemViewModel";
import type {
    Props,
    RoomListViewActions,
    RoomListViewSnapshot,
} from "./room-list-view.types";

export class RoomListViewModel
    extends BaseViewModel<RoomListViewSnapshot, Props>
    implements RoomListViewActions
{
    private running = false;
    private controller?: RoomListDynamicEntriesControllerInterface;
    private activeRoom?: string;
    private stateStream?: TaskHandleInterface;
    private visibleRooms: string[] = [];
    private roomListEntriesWithDynamicAdapters?: RoomListEntriesWithDynamicAdaptersResultInterface;
    private lastLoadMoreCount?: number;
    private canLoadMore = true;

    public constructor(props: Props) {
        const initialFilter = RoomListEntriesDynamicFilterKind_Tags.NonLeft;
        const initialFilters = RoomListViewModel.computeFilters(initialFilter);

        super(props, {
            rooms: [],
            numRooms: -1,
            selectedFilter: initialFilter,
            loadingState: undefined,
            filters: initialFilters,
            canLoadMore: true,
        });
    }

    private parseRoom(room: RoomInterface): RoomListItemViewModel {
        return new RoomListItemViewModel({ room });
    }

    private static computeFilters(selectedFilter: SupportedFilters) {
        return Object.entries(FILTERS)
            .filter(
                ([key]) =>
                    key !== RoomListEntriesDynamicFilterKind_Tags.NonLeft,
            )
            .map(([key, value]) => ({
                active: key === selectedFilter,
                name: value.name,
                key: key as SupportedFilters,
            }));
    }

    public onUpdate = async (
        updates: RoomListEntriesUpdate[],
    ): Promise<void> => {
        const currentSnapshot = this.getSnapshot();
        const newRooms = applyDiff(
            currentSnapshot.rooms,
            updates,
            this.parseRoom,
        );

        // Check if pagination succeeded
        if (this.lastLoadMoreCount !== undefined) {
            if (newRooms.length > this.lastLoadMoreCount) {
                // Rooms grew - we can try loading more again
                this.lastLoadMoreCount = undefined;
                this.canLoadMore = true;
            } else if (newRooms.length === this.lastLoadMoreCount) {
                // Rooms didn't grow - we've reached the end
                this.canLoadMore = false;
            }
        }

        this.snapshot.merge({
            rooms: newRooms,
            canLoadMore: this.canLoadMore,
        });
    };

    private onLoadingStateUpdate = (state: RoomListLoadingState) => {
        this.snapshot.merge({ loadingState: state });

        if (
            RoomListLoadingState.Loaded.instanceOf(state) &&
            state.inner.maximumNumberOfRooms !== undefined
        ) {
            this.snapshot.merge({
                numRooms: state.inner.maximumNumberOfRooms,
            });
        }
    };

    public run = (): void => {
        (async () => {
            this.running = true;
            const abortController = new AbortController();
            const roomList = await this.props.roomListService.allRooms({
                signal: abortController.signal,
            });
            const { state, stateStream } = roomList.loadingState({
                onUpdate: this.onLoadingStateUpdate,
            });
            this.stateStream = stateStream;
            this.snapshot.merge({ loadingState: state });

            this.roomListEntriesWithDynamicAdapters ||=
                roomList.entriesWithDynamicAdapters(50, this);
            this.controller =
                this.roomListEntriesWithDynamicAdapters.controller();

            const selectedFilter = this.getSnapshot().selectedFilter;
            this.controller.setFilter(FILTERS[selectedFilter].method);
            this.controller.addOnePage();
        })();
    };

    private subscribeToRooms = (): void => {
        const rooms = new Set(this.visibleRooms);
        if (this.activeRoom) rooms.add(this.activeRoom);
        this.props.roomListService.subscribeToRooms([...rooms]);
    };

    private subscribeToRoomsDebounced = debounce(
        (): void => {
            this.subscribeToRooms();
        },
        500,
        { trailing: true },
    );

    public setActiveRoom = (roomId: string): void => {
        this.activeRoom = roomId;
        this.subscribeToRooms();
    };

    public rangeChanged = (range: ListRange): void => {
        const currentRooms = this.getSnapshot().rooms;
        this.visibleRooms = currentRooms
            .slice(range.startIndex, range.endIndex)
            .map((room) => room.getSnapshot().roomId);
        this.subscribeToRoomsDebounced();
    };

    public loadMore = (): void => {
        const currentRoomCount = this.getSnapshot().rooms.length;

        // Check if we can load more
        if (!this.canLoadMore) {
            return;
        }

        // Prevent calling loadMore multiple times before rooms are actually added
        if (this.lastLoadMoreCount === currentRoomCount) {
            return;
        }

        if (!this.controller) {
            return;
        }

        this.lastLoadMoreCount = currentRoomCount;
        this.controller.addOnePage();
    };

    public toggleFilter = (filter: SupportedFilters): void => {
        const currentFilter = this.getSnapshot().selectedFilter;

        let newFilter: SupportedFilters;
        if (filter === currentFilter) {
            newFilter = RoomListEntriesDynamicFilterKind_Tags.NonLeft;
        } else {
            newFilter = filter;
        }

        this.snapshot.merge({
            selectedFilter: newFilter,
            filters: RoomListViewModel.computeFilters(newFilter),
        });
        this.run();
    };

    public isAllFilter = (): boolean => {
        return (
            this.getSnapshot().selectedFilter ===
            RoomListEntriesDynamicFilterKind_Tags.NonLeft
        );
    };
}
