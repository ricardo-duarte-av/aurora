/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import type { EventTimelineItem, RoomInfo, RoomInterface } from "../index.web";

/**
 * Props passed to RoomListItemViewModel constructor
 */
export interface Props {
    room: RoomInterface;
}

/**
 * Notification state for a room
 */
export interface NotificationState {
    isMention: boolean;
    isNotification: boolean;
    isActivityNotification: boolean;
    hasAnyNotificationOrActivity: boolean;
    invited: boolean;
}

/**
 * Snapshot represents the complete state of a single room list item
 */
export interface RoomListItemViewSnapshot {
    /** Room information from the SDK */
    info?: RoomInfo;

    /** Latest event in the room */
    latestEvent?: EventTimelineItem;

    /** Room ID */
    roomId: string;

    /** Display name */
    name: string;

    /** Avatar URL (already converted to HTTP) */
    avatar?: string;

    /** Message preview text */
    messagePreview?: string;

    /** Whether to show notification decoration */
    showNotificationDecoration: boolean;

    /** Notification state */
    notificationState: NotificationState;

    /** Whether room has active call */
    hasParticipantInCall: boolean;

    /** Whether text should be bold */
    isBold: boolean;
}
