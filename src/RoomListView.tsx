/*
 * Copyright 2025 New Vector Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import "./RoomListView.css";
import { InlineSpinner } from "@vector-im/compound-web";
import type { JSX } from "react";
import { useMemo } from "react";
import { GroupedVirtuoso } from "react-virtuoso";
import { useViewModel } from "@element-hq/web-shared-components";
import { RoomListItemView } from "./RoomListItemView";
import type { RoomListViewModel } from "./viewmodel/RoomListViewModel";
import type { RoomSummary } from "./viewmodel/RoomSummary";

type RoomListViewProps = {
    vm: RoomListViewModel;
    onRoomSelected: (roomId: string) => void;
};

/**
 * A virtualized list of rooms organized into sections.
 */
export function RoomListView({
    vm,
    onRoomSelected,
}: RoomListViewProps): JSX.Element {
    const { sections, currentRoomId, loading } = useViewModel(vm);

    // Compute flat list of rooms and group counts from sections
    const { rooms, groupCounts } = useMemo(() => {
        const rooms: RoomSummary[] = sections.flatMap((section) =>
            section.expanded ? section.rooms : [],
        );
        const groupCounts = sections.map((section) =>
            section.expanded ? section.rooms.length : 0,
        );

        return { rooms, groupCounts };
    }, [sections]);

    // Show centered spinner while waiting for room list to load
    if (loading) {
        return (
            <div
                className="mx_RoomListView"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                }}
            >
                <InlineSpinner />
            </div>
        );
    }

    // The first div is needed to make the virtualized list take all the remaining space and scroll correctly
    return (
        <div className="mx_RoomListView">
            <GroupedVirtuoso
                style={{ height: "100%" }}
                groupCounts={groupCounts}
                groupContent={(index) => (
                    <button
                        type="button"
                        style={{
                            backgroundColor: "var(--cpd-color-bg-canvas-default)",
                            color: "var(--cpd-color-text-primary)",
                            paddingTop: "1rem",
                            paddingRight: "1rem",
                            paddingLeft: "1rem",
                            paddingBottom: "0.5rem",
                            cursor: "pointer",
                            userSelect: "none",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            border: "none",
                            width: "100%",
                            textAlign: "left",
                        }}
                        onClick={() => vm.toggleSection(index)}
                    >
                        <span>{sections[index].name}</span>
                        <span
                            style={{
                                transform: sections[index].expanded
                                    ? "rotate(90deg)"
                                    : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                                display: "inline-block",
                            }}
                        >
                            ❯
                        </span>
                    </button>
                )}
                itemContent={(index) => {
                    const room = rooms[index];
                    return (
                        <RoomListItemView
                            room={room}
                            isSelected={currentRoomId === room.id}
                            onClick={() => onRoomSelected(room.id)}
                        />
                    );
                }}
            />
        </div>
    );
}
