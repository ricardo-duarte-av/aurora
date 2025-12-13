/*
 * Copyright 2025 New Vector Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import "./RoomHeaderView.css";
import "./viewmodel/TimelineViewModel";
import { Avatar } from "@vector-im/compound-web";
import type React from "react";
import { useMemo } from "react";
import { useViewModel } from "@element-hq/web-shared-components";
import type { RoomListViewModel } from "./viewmodel/RoomListViewModel";

type RoomHeaderViewProps = {
    vm: RoomListViewModel;
    currentRoomId: string;
};

function mxcToUrl(mxcUrl: string): string {
    return `${mxcUrl.replace(
        /^mxc:\/\//,
        "https://matrix.org/_matrix/media/v3/thumbnail/",
    )}?width=48&height=48`;
}

export const RoomHeaderView: React.FC<RoomHeaderViewProps> = ({
    vm,
    currentRoomId,
}) => {
    const { rooms } = useViewModel(vm);
    const room = useMemo(
        () => rooms.find((room) => room.getSnapshot().roomId === currentRoomId),
        [currentRoomId, rooms],
    );

    if (!room) {
        return null;
    }

    const roomInfo = useViewModel(room);

    return (
        <div className="mx_RoomHeader">
            <div className="mx_RoomHeader_avatar">
                <Avatar
                    id={currentRoomId}
                    name={roomInfo?.info?.displayName || ""}
                    src={
                        roomInfo?.info?.avatarUrl
                            ? mxcToUrl(roomInfo.info.avatarUrl)
                            : ""
                    }
                    size="40px"
                />
            </div>
            <div className="mx_RoomHeader_name">
                {roomInfo?.info?.displayName?.trim() || ""}
            </div>
        </div>
    );
};
