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
import { FILTERS, type SupportedFilters } from "../Filter";
import {
    type RoomInterface,
    type RoomListDynamicEntriesControllerInterface,
    RoomListEntriesDynamicFilterKind_Tags,
    type RoomListEntriesUpdate,
    RoomListEntriesUpdate_Tags,
    type RoomListEntriesWithDynamicAdaptersResultInterface,
    RoomListLoadingState,
    type TaskHandleInterface,
} from "../index.web";
import { buildRoomSummary, type RoomSummary } from "./RoomSummary";
import type {
    Props,
    RoomListViewActions,
    RoomListViewSnapshot,
} from "./room-list-view.types";

export class RoomListViewModel
    extends BaseViewModel<RoomListViewSnapshot, Props>
    implements RoomListViewActions
{
    private controller?: RoomListDynamicEntriesControllerInterface;
    private activeRoom?: string;
    private stateStream?: TaskHandleInterface;
    private visibleRooms: string[] = [];
    private roomListEntriesWithDynamicAdapters?: RoomListEntriesWithDynamicAdaptersResultInterface;
    private diffQueue: Promise<void> = Promise.resolve();
    private hasSetupEntries = false;
    private roomList?: Awaited<
        ReturnType<typeof this.props.roomListService.allRooms>
    >;

    public constructor(props: Props) {
        const initialFilter = RoomListEntriesDynamicFilterKind_Tags.NonLeft;
        const initialFilters = RoomListViewModel.computeFilters(initialFilter);

        super(props, {
            rooms: [],
            selectedFilter: initialFilter,
            filters: initialFilters,
            loading: true,
            currentRoomId: undefined,
        });

        this.run();
    }

    private async parseRoom(room: RoomInterface): Promise<RoomSummary> {
        // This prevents showing empty names while encryption decrypts
        const [roomInfo, latestEvent] = await Promise.all([
            room.roomInfo(),
            room.latestEvent(),
        ]);

        const summary = buildRoomSummary(room, roomInfo, latestEvent);

        return summary;
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

    private async applyDiff(
        items: RoomSummary[],
        updates: RoomListEntriesUpdate[],
    ): Promise<RoomSummary[]> {
        let newItems = [...items];

        for (const update of updates) {
            switch (update.tag) {
                case RoomListEntriesUpdate_Tags.Set:
                    newItems[update.inner.index] = await this.parseRoom(
                        update.inner.value,
                    );
                    newItems = [...newItems];
                    break;
                case RoomListEntriesUpdate_Tags.PushBack:
                    newItems = [
                        ...newItems,
                        await this.parseRoom(update.inner.value),
                    ];
                    break;
                case RoomListEntriesUpdate_Tags.PushFront:
                    newItems = [
                        await this.parseRoom(update.inner.value),
                        ...newItems,
                    ];
                    break;
                case RoomListEntriesUpdate_Tags.Clear:
                    newItems = [];
                    break;
                case RoomListEntriesUpdate_Tags.PopFront:
                    newItems.shift();
                    newItems = [...newItems];
                    break;
                case RoomListEntriesUpdate_Tags.PopBack:
                    newItems.pop();
                    newItems = [...newItems];
                    break;
                case RoomListEntriesUpdate_Tags.Insert:
                    newItems.splice(
                        update.inner.index,
                        0,
                        await this.parseRoom(update.inner.value),
                    );
                    newItems = [...newItems];
                    break;
                case RoomListEntriesUpdate_Tags.Remove:
                    newItems.splice(update.inner.index, 1);
                    newItems = [...newItems];
                    break;
                case RoomListEntriesUpdate_Tags.Truncate:
                    newItems = newItems.slice(0, update.inner.length);
                    break;
                case RoomListEntriesUpdate_Tags.Reset:
                    newItems = await Promise.all(
                        update.inner.values.map((v) => this.parseRoom(v)),
                    );
                    break;
                case RoomListEntriesUpdate_Tags.Append:
                    newItems = [
                        ...newItems,
                        ...(await Promise.all(
                            update.inner.values.map((v) => this.parseRoom(v)),
                        )),
                    ];
                    break;
            }
        }

        return newItems;
    }

    public onUpdate = async (
        updates: RoomListEntriesUpdate[],
    ): Promise<void> => {
        this.diffQueue = this.diffQueue.then(() =>
            this.processDiffUpdates(updates),
        );
    };

    private async processDiffUpdates(
        updates: RoomListEntriesUpdate[],
    ): Promise<void> {
        const currentSnapshot = this.getSnapshot();
        const newRooms = await this.applyDiff(currentSnapshot.rooms, updates);
        this.snapshot.merge({ rooms: newRooms });
    }

    private handleLoadingStateChange = (state: RoomListLoadingState): void => {
        if (RoomListLoadingState.NotLoaded.instanceOf(state)) {
            this.snapshot.merge({ loading: true });
        } else if (RoomListLoadingState.Loaded.instanceOf(state)) {
            this.snapshot.merge({ loading: false });

            // Only setup entries once, even if Loaded fires multiple times
            if (!this.hasSetupEntries) {
                this.hasSetupEntries = true;
                this.setupEntries();
            }
        }
    };

    private run = (): void => {
        (async () => {
            const abortController = new AbortController();
            this.roomList = await this.props.roomListService.allRooms({
                signal: abortController.signal,
            });

            // Subscribe to loading state to understand when rooms are ready
            const { state, stateStream } = this.roomList.loadingState({
                onUpdate: this.handleLoadingStateChange,
            });
            this.stateStream = stateStream;

            // Handle initial state
            this.handleLoadingStateChange(state);
        })();

        this.disposables.track(() => {
            this.stateStream?.cancel();
        });
    };

    private setupEntries = (): void => {
        if (this.roomListEntriesWithDynamicAdapters) {
            return;
        }

        if (!this.roomList) {
            console.error(
                "[RoomListViewModel] Cannot setup entries: roomList not initialized",
            );
            return;
        }

        this.roomListEntriesWithDynamicAdapters =
            this.roomList.entriesWithDynamicAdapters(50, this);
        this.controller = this.roomListEntriesWithDynamicAdapters.controller();

        const selectedFilter = this.getSnapshot().selectedFilter;
        this.controller.setFilter(FILTERS[selectedFilter].method);
        this.controller.addOnePage();
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
        this.snapshot.merge({ currentRoomId: roomId });
        this.subscribeToRooms();
    };

    public rangeChanged = (range: ListRange): void => {
        const currentRooms = this.getSnapshot().rooms;
        this.visibleRooms = currentRooms
            .slice(range.startIndex, range.endIndex)
            .map((room) => room.id);
        this.subscribeToRoomsDebounced();
    };

    public loadMore = (): void => {
        this.controller?.addOnePage();
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

        if (this.controller) {
            this.controller.setFilter(FILTERS[newFilter].method);
        }
    };

    public isAllFilter = (): boolean => {
        return (
            this.getSnapshot().selectedFilter ===
            RoomListEntriesDynamicFilterKind_Tags.NonLeft
        );
    };
}
