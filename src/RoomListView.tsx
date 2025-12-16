/*
 * Copyright 2025 New Vector Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import "./RoomListView.css";
import { InlineSpinner } from "@vector-im/compound-web";
import { type JSX, useCallback } from "react";
import { Virtuoso } from "react-virtuoso";
import { useViewModel } from "@element-hq/web-shared-components";
import { RoomListItemView } from "./RoomListItemView";
import type { RoomListViewModel } from "./viewmodel/RoomListViewModel";

type RoomListViewProps = {
    vm: RoomListViewModel;
    onRoomSelected: (roomId: string) => void;
};

/**
 * A virtualized list of rooms.
 */
export function RoomListView({
    vm,
    onRoomSelected,
}: RoomListViewProps): JSX.Element {
    const { rooms, canLoadMore, currentRoomId } = useViewModel(vm);

    // Show spinner if we're in the "All" filter AND can load more rooms
    const showFooter = vm.isAllFilter() && canLoadMore;

    // The first div is needed to make the virtualized list take all the remaining space and scroll correctly
    return (
        <div className="mx_RoomListView">
            <Virtuoso
                data={rooms}
                endReached={vm.loadMore}
                increaseViewportBy={200}
                fixedItemHeight={48}
                context={{ currentRoomId, onRoomSelected }}
                rangeChanged={vm.rangeChanged}
                itemContent={(_, room, { currentRoomId, onRoomSelected }) => {
                    const roomId = room.getSnapshot().roomId;
                    return (
                        <RoomListItemView
                            room={room}
                            isSelected={currentRoomId === roomId}
                            onClick={() => onRoomSelected(roomId)}
                        />
                    );
                }}
                components={{
                    Footer: showFooter ? Footer : undefined,
                }}
            />
        </div>
    );
}

const Footer = () => {
    return (
        <div
            style={{
                padding: "2rem",
                display: "flex",
                justifyContent: "center",
            }}
        >
            <InlineSpinner />
        </div>
    );
};
