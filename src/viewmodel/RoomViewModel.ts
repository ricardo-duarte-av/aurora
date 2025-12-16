/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { BaseViewModel } from "@element-hq/web-shared-components";
import { MemberListViewModel } from "./MemberListViewModel";
import { TimelineViewModel } from "./TimelineViewModel";
import { RoomItemViewModel } from "./RoomListItemViewModel";
import type { Props, RoomViewSnapshot } from "./room-view.types";

export class RoomViewModel extends BaseViewModel<RoomViewSnapshot, Props> {
    public constructor(props: Props) {
        const roomId = props.room.id();
        const timelineViewModel = new TimelineViewModel({ room: props.room });
        const memberListViewModel = new MemberListViewModel({
            room: props.room,
        });
        const roomHeaderViewModel = new RoomItemViewModel({ room: props.room });

        super(props, {
            timelineViewModel,
            memberListViewModel,
            roomHeaderViewModel,
            roomId,
        });

        this.disposables.track(timelineViewModel);
        this.disposables.track(memberListViewModel);
        this.disposables.track(roomHeaderViewModel);
    }
}
