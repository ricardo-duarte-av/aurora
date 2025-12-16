/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { BaseViewModel } from "@element-hq/web-shared-components";
import type {
    Props,
    RoomListItemViewSnapshot,
} from "./room-list-item-view.types";
import {
    Membership,
    MsgLikeKind,
    TimelineItemContent,
} from "../generated/matrix_sdk_ffi.ts";

function mxcToUrl(mxcUrl: string): string {
    return `${mxcUrl.replace(
        /^mxc:\/\//,
        "https://matrix.org/_matrix/media/v3/thumbnail/",
    )}?width=48&height=48`;
}

export class RoomItemViewModel extends BaseViewModel<
    RoomListItemViewSnapshot,
    Props
> {
    public constructor(props: Props) {
        super(props, {
            info: undefined,
            latestEvent: undefined,
            roomId: props.room.id(),
            name: "placeholder name",
            avatar: undefined,
            messagePreview: undefined,
            showNotificationDecoration: false,
            notificationState: {
                isMention: false,
                isNotification: false,
                isActivityNotification: false,
                hasAnyNotificationOrActivity: false,
                invited: false,
            },
            hasParticipantInCall: false,
            isBold: false,
        });
        this.load();
    }

    private load = async (): Promise<void> => {
        const [info, latestEvent] = await Promise.all([
            this.props.room.roomInfo(),
            this.props.room.latestEvent(),
        ]);
        this.updateSnapshot(info, latestEvent);
    };

    private updateSnapshot(
        info: RoomListItemViewSnapshot["info"],
        latestEvent: RoomListItemViewSnapshot["latestEvent"],
    ): void {
        const isNotification = Number(info?.numUnreadMessages) > 0;
        const invited = info?.membership === Membership.Invited;

        const notificationState = {
            isMention: Number(info?.numUnreadMentions) > 0,
            isNotification,
            isActivityNotification:
                Number(info?.numUnreadNotifications) > 0 && !isNotification,
            hasAnyNotificationOrActivity:
                Number(info?.numUnreadNotifications) > 0 || invited,
            invited,
        };

        const displayName = info?.displayName?.trim() || "placeholder name";
        const avatarUrl = info?.avatarUrl;

        const messagePreview =
            latestEvent &&
            TimelineItemContent.MsgLike.instanceOf(latestEvent.content) &&
            MsgLikeKind.Message.instanceOf(
                latestEvent.content.inner.content.kind,
            )
                ? latestEvent.content.inner.content.kind.inner.content.body
                : undefined;

        this.snapshot.merge({
            info,
            latestEvent,
            name: displayName,
            avatar: avatarUrl ? mxcToUrl(avatarUrl) : undefined,
            messagePreview,
            showNotificationDecoration:
                notificationState.hasAnyNotificationOrActivity,
            notificationState,
            hasParticipantInCall: Boolean(info?.hasRoomCall),
            isBold: notificationState.hasAnyNotificationOrActivity,
        });
    }
}
