/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import type { MemberListStore } from "../MemberList/MemberListStore";
import type { SessionStore } from "../SessionStore";
import type TimelineStore from "../TimelineStore";
import type {
    ClientInterface,
    HomeserverLoginDetailsInterface,
    OAuthAuthorizationDataInterface,
} from "../index.web";
import type { ClientViewModel } from "./ClientViewModel";
import type { LoginViewModel } from "./LoginViewModel";

// Re-export OIDC types for convenience
export type {
    HomeserverLoginDetailsInterface,
    OAuthAuthorizationDataInterface,
};

export enum ClientState {
    Unknown = 0,
    LoadingSession = 1,
    LoggedOut = 3,
    LoggingIn = 4,
    LoggedIn = 2,
    Syncing = 5,
}

export interface LoginParams {
    username: string;
    password: string;
    server: string;
}

/**
 * Props passed to ClientViewModel constructor
 */
export interface Props {
    sessionStore: SessionStore;
    userIdForLoading?: string;
    onLogin?: (userId: string, clientViewModel: ClientViewModel) => void;
}

/**
 * Snapshot represents the complete state of the client view
 */
export interface ClientViewSnapshot {
    /** Current authentication state */
    clientState: ClientState;

    /** Matrix SDK client instance */
    client?: ClientInterface;

    /** Store for the current room's timeline (will become ViewModel in future) */
    timelineStore?: TimelineStore;

    /** ViewModel for the login form */
    loginViewModel?: LoginViewModel;

    /** Store for the current room's member list (will become ViewModel in future) */
    memberListStore?: MemberListStore;

    /** Current user ID */
    userId?: string;

    /** Current user's display name */
    displayName?: string;

    /** Current user's avatar URL */
    avatarUrl?: string;

    /** Currently selected room ID */
    currentRoomId?: string;
}

/**
 * Actions that views can call on the ClientViewModel
 */
export interface ClientViewActions {
    /**
     * Login with username and password
     */
    login(params: LoginParams): Promise<void>;

    /**
     * Logout the current user
     */
    logout(): void;

    /**
     * Attempt to restore a previous session from storage
     */
    tryLoadSession(): Promise<void>;

    /**
     * Set the current room and initialize its timeline/member stores
     */
    setCurrentRoom(roomId: string): void;
}
