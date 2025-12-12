/*
 * Copyright 2025 New Vector Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import classNames from "classnames";
import type React from "react";
import { type JSX, memo } from "react";
import "./RoomListItemView.css";

import { Avatar } from "@vector-im/compound-web";
import { NotificationDecoration } from "./NotificationDecoration";
import type { RoomListItemViewModel } from "./viewmodel/RoomListItemViewModel";
import { Flex } from "./utils/Flex";
import { useViewModel } from "@element-hq/web-shared-components";

interface RoomListItemViewProps
    extends React.HTMLAttributes<HTMLButtonElement> {
    /**
     * The room to display
     */
    room: RoomListItemViewModel;
    /**
     * Whether the room is selected
     */
    isSelected: boolean;
}

/**
 * An item in the room list
 */
export const RoomListItemView = memo(function RoomListItemView({
    room,
    isSelected,
    ...props
}: RoomListItemViewProps): JSX.Element {
    const {
        name,
        avatar,
        messagePreview,
        showNotificationDecoration,
        notificationState,
        hasParticipantInCall,
        isBold,
    } = useViewModel(room);

    return (
        <button
            className={classNames("mx_RoomListItemView", {
                mx_RoomListItemView_selected: isSelected,
                mx_RoomListItemView_bold: isBold,
            })}
            type="button"
            aria-selected={isSelected}
            {...props}
        >
            {/* We need this extra div between the button and the content in order to add a padding which is not messing with the virtualized list */}
            <Flex
                className="mx_RoomListItemView_container"
                gap="var(--cpd-space-3x)"
                align="center"
            >
                <Avatar
                    id={room.getSnapshot().roomId}
                    name={name}
                    src={avatar}
                    size="26px"
                />
                <Flex
                    className="mx_RoomListItemView_content"
                    gap="var(--cpd-space-2x)"
                    align="center"
                    justify="space-between"
                >
                    {/* We truncate the room name when too long. Title here is to show the full name on hover */}
                    <div className="mx_RoomListItemView_text">
                        <div
                            className="mx_RoomListItemView_roomName"
                            title={name}
                        >
                            {name}
                        </div>
                        <div className="mx_RoomListItemView_messagePreview">
                            {messagePreview}
                        </div>
                    </div>
                    <>
                        {/* aria-hidden because we summarise the unread count/notification status in a11yLabel variable */}
                        {showNotificationDecoration && (
                            <NotificationDecoration
                                notificationState={notificationState}
                                aria-hidden={true}
                                hasVideoCall={hasParticipantInCall}
                            />
                        )}
                    </>
                </Flex>
            </Flex>
        </button>
    );
});
