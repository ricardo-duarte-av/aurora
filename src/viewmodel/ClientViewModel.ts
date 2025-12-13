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
import {
    ClientBuilder,
    type ClientInterface,
    type HomeserverLoginDetailsInterface,
    LogLevel,
    type OAuthAuthorizationDataInterface,
    OidcPrompt,
    type RoomListServiceInterface,
    SlidingSyncVersionBuilder,
    type SyncServiceInterface,
    type TaskHandleInterface,
    initPlatform,
} from "../index.web.ts";
import { getOidcConfiguration } from "../oidcConfig";
import { printRustError } from "../utils.ts";
import {
    ClientState,
    type ClientViewActions,
    type ClientViewSnapshot,
    type LoginParams,
    type Props,
} from "./client-view.types";
import { LoginViewModel } from "./LoginViewModel";
import { RoomListViewModel } from "./RoomListViewModel";

export class ClientViewModel
    extends BaseViewModel<ClientViewSnapshot, Props>
    implements ClientViewActions
{
    private syncService?: SyncServiceInterface;
    private roomListService?: RoomListServiceInterface;
    private oidcAuthData?: OAuthAuthorizationDataInterface;
    private clientDelegateHandle?: TaskHandleInterface;

    public constructor(props: Props) {
        super(props, {
            clientState: ClientState.Unknown,
            client: undefined,
            timelineStore: undefined,
            roomListViewModel: undefined,
            loginViewModel: undefined,
            memberListStore: undefined,
            userId: undefined,
            displayName: undefined,
            avatarUrl: undefined,
            currentRoomId: undefined,
        });

        // Create loginViewModel after super() call
        this.snapshot.merge({
            loginViewModel: new LoginViewModel({
                onLogin: this.login.bind(this),
                onCheckHomeserver: this.checkHomeserverCapabilities.bind(this),
                onGetOidcAuthUrl: this.getOidcAuthUrl.bind(this),
                onLoginWithOidcCallback: this.loginWithOidcCallback.bind(this),
            }),
        });
    }

    // Private getter for accessing client from snapshot
    private get client(): ClientInterface | undefined {
        return this.getSnapshot().client;
    }

    private async registerServiceWorker() {
        const registration = await navigator.serviceWorker.register("sw.js");
        if (!registration) {
            throw new Error("Service worker registration failed");
        }

        navigator.serviceWorker.addEventListener(
            "message",
            this.onServiceWorkerPostMessage,
        );
        await registration.update();
    }

    private onServiceWorkerPostMessage = (event: MessageEvent): void => {
        const client = this.getSnapshot().client;
        if (!client) return;
        try {
            const data = event.data as { type?: string; responseKey?: string };
            if (
                event.origin === window.origin &&
                data?.type === "userinfo" &&
                data?.responseKey
            ) {
                const accessToken = client.session().accessToken;
                const homeserver = client.homeserver();
                const source = event.source;
                if (source) {
                    source.postMessage({
                        responseKey: data.responseKey,
                        accessToken,
                        homeserver,
                    });
                }
            }
        } catch (e) {
            console.error("Error responding to service worker: ", e);
        }
    };

    private getClientBuilder = () =>
        new ClientBuilder().slidingSyncVersionBuilder(
            SlidingSyncVersionBuilder.DiscoverNative,
        );

    public async tryLoadSession(): Promise<void> {
        console.log(
            "tryLoadSession called with userIdForLoading:",
            this.props.userIdForLoading,
        );
        this.snapshot.merge({ clientState: ClientState.LoadingSession });

        try {
            // No session to load
            // For the first login, we don't have a user ID yet
            if (!this.props.userIdForLoading) {
                console.log(
                    "No userIdForLoading provided, transitioning to LoggedOut",
                );
                throw new Error("No user ID provided");
            }

            const sessions = this.props.sessionStore.load();
            if (!sessions) throw new Error("No sessions found");

            const session = sessions[this.props.userIdForLoading];
            if (!session) {
                throw new Error("No session found");
            }

            const client = await this.getClientBuilder()
                .homeserverUrl(session.homeserverUrl)
                .build();
            await client.restoreSession(session);

            const userId = client.userId();
            const displayName = await client.displayName();
            const avatarUrl = await client.avatarUrl();

            console.log("Session restored, transitioning to LoggedIn");
            this.snapshot.merge({
                clientState: ClientState.LoggedIn,
                client,
                userId,
                displayName,
                avatarUrl,
            });
        } catch (e) {
            printRustError("Failed to restore session", e);
            console.log("Setting clientState to LoggedOut");
            this.snapshot.merge({ clientState: ClientState.LoggedOut });
            return;
        }

        await this.sync();
    }

    /**
     * Log out the current user
     * This can be called either:
     * 1. By the user explicitly logging out
     * 2. Automatically when the SDK detects an auth error (e.g. M_UNKNOWN_TOKEN)
     *
     * Note: Currently treats all logouts as hard logouts (clearing all session data).
     * Soft logout support can be added later.
     */
    public logout(): void {
        const userId = this.client?.userId();
        if (userId) {
            this.props.sessionStore.clear(userId);
        }

        this.snapshot.set({
            clientState: ClientState.LoggedOut,
            client: undefined,
            timelineStore: undefined,
            roomListViewModel: undefined,
            memberListStore: undefined,
            userId: undefined,
            displayName: undefined,
            avatarUrl: undefined,
            currentRoomId: undefined,
            // Keep loginViewModel so we can log in again
            loginViewModel: this.getSnapshot().loginViewModel,
        });
    }

    public async login({
        username,
        password,
        server,
    }: LoginParams): Promise<void> {
        this.snapshot.merge({ clientState: ClientState.LoggingIn });
        this.getSnapshot().loginViewModel?.setLoggingIn(true);

        const client = await this.getClientBuilder()
            .homeserverUrl(server)
            .build();

        console.log("starting sdk...");
        try {
            initPlatform(
                {
                    logLevel: LogLevel.Trace,
                    traceLogPacks: [],
                    extraTargets: [],
                    writeToStdoutOrSystem: true,
                    writeToFiles: undefined,
                },
                true,
            );

            await client.login(username, password, "rust-sdk", undefined);
            console.log("logged in...");
            this.props.sessionStore.save(client.session());

            const userId = client.userId();
            const displayName = await client.displayName();
            const avatarUrl = await client.avatarUrl();

            this.snapshot.merge({
                clientState: ClientState.LoggedIn,
                client,
                userId,
                displayName,
                avatarUrl,
            });
            this.getSnapshot().loginViewModel?.setLoggingIn(false);

            // Notify parent that login completed
            if (this.props.onLogin && userId) {
                this.props.onLogin(userId, this);
            }
        } catch (e) {
            printRustError("login failed", e);
            this.snapshot.merge({ clientState: ClientState.Unknown });
            this.getSnapshot().loginViewModel?.setLoggingIn(false);
            return;
        }

        await this.sync();
    }

    /**
     * Check what login methods a homeserver supports
     * Returns login details including OIDC and password support
     */
    public async checkHomeserverCapabilities(
        server: string,
    ): Promise<HomeserverLoginDetailsInterface> {
        try {
            const client = await this.getClientBuilder()
                .homeserverUrl(server)
                .build();

            const loginDetails = await client.homeserverLoginDetails();

            // Store the client for later use
            this.snapshot.merge({ client });

            return loginDetails;
        } catch (e) {
            printRustError("Failed to check homeserver capabilities", e);
            throw e;
        }
    }

    /**
     * Get OIDC authorization URL for a given server
     * This initiates the OIDC login flow
     */
    public async getOidcAuthUrl(
        server: string,
        loginHint?: string,
    ): Promise<OAuthAuthorizationDataInterface> {
        // If we don't have a client yet, create one
        let client = this.getSnapshot().client;
        if (!client) {
            client = await this.getClientBuilder()
                .homeserverUrl(server)
                .build();
            this.snapshot.merge({ client });
        }

        try {
            const oidcConfig = getOidcConfiguration();

            // Use "Consent" prompt for login (Create is broken per element-x-ios)
            const authData = await client.urlForOidc(
                oidcConfig,
                OidcPrompt.Consent.new(),
                loginHint,
                undefined, // deviceId - let SDK generate
                undefined, // additionalScopes
            );

            // Store auth data for later use
            this.oidcAuthData = authData;

            return authData;
        } catch (e) {
            printRustError("Failed to get OIDC auth URL", e);
            throw e;
        }
    }

    /**
     * Complete OIDC login with the callback URL
     * Called after the user successfully authenticates with the OIDC provider
     */
    public async loginWithOidcCallback(
        callbackUrl: string,
        homeserverUrl: string,
    ): Promise<void> {
        this.snapshot.merge({ clientState: ClientState.LoggingIn });
        this.getSnapshot().loginViewModel?.setLoggingIn(true);

        try {
            // If we don't have a client (lost during redirect), recreate it
            let client = this.getSnapshot().client;
            if (!client) {
                console.log("Recreating client for OIDC callback");
                client = await this.getClientBuilder()
                    .homeserverUrl(homeserverUrl)
                    .build();
                this.snapshot.merge({ client });
            }

            initPlatform(
                {
                    logLevel: LogLevel.Trace,
                    traceLogPacks: [],
                    extraTargets: [],
                    writeToStdoutOrSystem: true,
                    writeToFiles: undefined,
                },
                true,
            );

            await client.loginWithOidcCallback(callbackUrl);
            console.log("OIDC login successful");

            // Save the session
            this.props.sessionStore.save(client.session());

            const userId = client.userId();
            const displayName = await client.displayName();
            const avatarUrl = await client.avatarUrl();

            this.snapshot.merge({
                clientState: ClientState.LoggedIn,
                client,
                userId,
                displayName,
                avatarUrl,
            });
            this.getSnapshot().loginViewModel?.setLoggingIn(false);

            // Notify parent that login completed
            if (this.props.onLogin && userId) {
                this.props.onLogin(userId, this);
            }
        } catch (e) {
            printRustError("OIDC login failed", e);
            this.snapshot.merge({ clientState: ClientState.Unknown });
            this.getSnapshot().loginViewModel?.setLoggingIn(false);
            throw e;
        }

        await this.sync();
    }

    /**
     * Abort an in-progress OIDC login
     * Should be called if the user cancels the login flow
     */
    public async abortOidcLogin(): Promise<void> {
        const client = this.getSnapshot().client;
        if (!client || !this.oidcAuthData) {
            console.warn("No OIDC login in progress to abort");
            return;
        }

        try {
            await client.abortOidcAuth(this.oidcAuthData);
            console.log("OIDC login aborted");
        } catch (e) {
            printRustError("Failed to abort OIDC login", e);
        } finally {
            this.oidcAuthData = undefined;
            this.snapshot.merge({ clientState: ClientState.LoggedOut });
            this.getSnapshot().loginViewModel?.setLoggingIn(false);
        }
    }

    private async sync(): Promise<void> {
        this.registerServiceWorker();

        const client = this.getSnapshot().client;
        if (!client) {
            console.error("Cannot sync without client");
            return;
        }

        try {
            // Set up client delegate to handle auth errors
            const delegateHandle = client.setDelegate({
                didReceiveAuthError: (isSoftLogout: boolean) => {
                    console.error(
                        `Received authentication error, soft logout: ${isSoftLogout}`,
                    );
                    // For now, treat all auth errors as hard logout
                    // We can add soft logout support later
                    this.logout();
                },
            });

            // Track the delegate handle so it gets cleaned up properly
            if (delegateHandle) {
                this.clientDelegateHandle = delegateHandle;
                this.disposables.track(() => {
                    this.clientDelegateHandle?.cancel();
                });
            } else {
                console.error("Failed to set client delegate - no handle returned");
            }

            const syncServiceBuilder = client.syncService();
            this.syncService = await syncServiceBuilder
                .withOfflineMode()
                .finish();
            this.roomListService = this.syncService.roomListService();

            // Initialize room list view model now that sync services are ready
            const roomListViewModel = new RoomListViewModel({
                syncServiceInterface: this.syncService,
                roomListService: this.roomListService,
            });

            console.log("Sync services created, transitioning to Syncing");
            this.snapshot.merge({
                clientState: ClientState.Syncing,
                roomListViewModel,
            });
            await this.syncService.start();
            console.log("syncing...");
        } catch (e) {
            printRustError("syncing failed", e);
            this.snapshot.merge({ clientState: ClientState.Unknown });
            return;
        }
    }

    public setCurrentRoom(roomId: string): void {
        if (roomId === "") return;

        const snapshot = this.getSnapshot();
        const currentTimeline = snapshot.timelineStore;

        // Check if we're already viewing this room
        if (snapshot.currentRoomId === roomId) {
            return;
        }

        // Dispose the current timeline and member list
        currentTimeline?.dispose();
        snapshot.memberListStore?.dispose();

        const client = snapshot.client;
        if (!client) return;

        const room = client.getRoom(roomId);
        if (!room) return;

        const timelineStore = new TimelineViewModel({ room });
        const memberListStore = new MemberListViewModel({ roomId, client });

        this.snapshot.merge({
            timelineStore,
            memberListStore,
            currentRoomId: roomId,
        });
    }
}
