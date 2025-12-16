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
    type ClientSessionDelegate,
    type HomeserverLoginDetailsInterface,
    LogLevel,
    type OAuthAuthorizationDataInterface,
    OidcPrompt,
    type RoomListServiceInterface,
    type Session,
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
    private client?: ClientInterface;

    public constructor(props: Props) {
        super(props, {
            clientState: ClientState.Unknown,
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
        this.snapshot.merge({ loginViewModel: this.initLoginViewModel() });
    }

    private initLoginViewModel(): LoginViewModel {
        return new LoginViewModel({
            onLogin: this.login.bind(this),
            onCheckHomeserver: this.checkHomeserverCapabilities.bind(this),
            onGetOidcAuthUrl: this.getOidcAuthUrl.bind(this),
            onLoginWithOidcCallback: this.loginWithOidcCallback.bind(this),
            onAbortOidcLogin: this.abortOidcLogin.bind(this),
        });
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
        if (!this.client) return;
        try {
            const data = event.data as { type?: string; responseKey?: string };
            if (
                event.origin === window.origin &&
                data?.type === "userinfo" &&
                data?.responseKey
            ) {
                const accessToken = this.client.session().accessToken;
                const homeserver = this.client.homeserver();
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

    /**
     * Create a session delegate that handles saving and retrieving sessions
     * The SDK will call this delegate to persist session updates when tokens are refreshed
     */
    private getSessionDelegate = (): ClientSessionDelegate => ({
        retrieveSessionFromKeychain: (userId: string): Session => {
            console.log(
                `[SessionDelegate] SDK requesting session for user: ${userId}`,
            );
            const sessions = this.props.sessionStore.load();
            if (!sessions || !sessions[userId]) {
                throw new Error(`No session found for user ${userId}`);
            }
            const session = sessions[userId];
            console.log(
                `[SessionDelegate] Returning session with oidcData: ${!!session.oidcData}`,
            );
            return session;
        },
        saveSessionInKeychain: (session: Session): void => {
            console.log(
                `[SessionDelegate] SDK triggered session save for ${session.userId}`,
            );
            console.log(
                `[SessionDelegate] Session details: hasOidcData=${!!session.oidcData}, ` +
                    `hasAccessToken=${!!session.accessToken}, ` +
                    `hasRefreshToken=${!!session.refreshToken}`,
            );
            this.props.sessionStore.save(session);
        },
    });

    private getClientBuilder = () =>
        new ClientBuilder()
            .slidingSyncVersionBuilder(SlidingSyncVersionBuilder.DiscoverNative)
            .setSessionDelegate(this.getSessionDelegate());

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

            this.client = await this.getClientBuilder()
                .serverNameOrHomeserverUrl(session.homeserverUrl)
                .build();
            await this.client.restoreSession(session);

            const userId = this.client.userId();
            const displayName = await this.client.displayName();
            const avatarUrl = await this.client.avatarUrl();

            console.log("Session restored, transitioning to LoggedIn");
            this.snapshot.merge({
                clientState: ClientState.LoggedIn,
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

        this.client = undefined;

        this.snapshot.set({
            clientState: ClientState.LoggedOut,
            timelineStore: undefined,
            roomListViewModel: undefined,
            memberListStore: undefined,
            userId: undefined,
            displayName: undefined,
            avatarUrl: undefined,
            currentRoomId: undefined,
            // Keep loginViewModel so we can log in again
            loginViewModel: this.initLoginViewModel(),
        });
    }

    /**
     * Initialize platform (SDK logging) - should only be called once
     */
    private initializePlatform(): void {
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
    }

    /**
     * Complete login after authentication succeeds
     * Saves session, updates state, and starts sync
     */
    private async completeLogin(): Promise<void> {
        if (!this.client) {
            throw new Error("Client not available");
        }

        // Save the session
        this.props.sessionStore.save(this.client.session());

        const userId = this.client.userId();
        const displayName = await this.client.displayName();
        const avatarUrl = await this.client.avatarUrl();

        this.snapshot.merge({
            clientState: ClientState.LoggedIn,
            userId,
            displayName,
            avatarUrl,
        });
        this.getSnapshot().loginViewModel?.setLoggingIn(false);

        // Notify parent that login completed
        if (this.props.onLogin && userId) {
            this.props.onLogin(userId, this);
        }

        await this.sync();
    }

    /**
     * Handle login failure
     */
    private handleLoginFailure(error: unknown, errorMessage: string): void {
        printRustError(errorMessage, error);
        this.snapshot.merge({ clientState: ClientState.Unknown });
        this.getSnapshot().loginViewModel?.setLoggingIn(false);
    }

    public async login({ username, password }: LoginParams): Promise<void> {
        this.snapshot.merge({ clientState: ClientState.LoggingIn });
        this.getSnapshot().loginViewModel?.setLoggingIn(true);

        if (!this.client) {
            throw new Error(
                "No client available. Call checkHomeserverCapabilities first.",
            );
        }

        try {
            this.initializePlatform();
            await this.client.login(username, password, "rust-sdk", undefined);
            console.log("Password login successful");
            await this.completeLogin();
        } catch (e) {
            this.handleLoginFailure(e, "Password login failed");
            throw e;
        }
    }

    /**
     * Check what login methods a homeserver supports
     * Returns login details including OIDC and password support
     */
    public async checkHomeserverCapabilities(
        server: string,
    ): Promise<HomeserverLoginDetailsInterface> {
        try {
            // Create the auth client - this will be reused for login
            this.client = await this.getClientBuilder()
                .serverNameOrHomeserverUrl(server)
                .build();

            const loginDetails = await this.client.homeserverLoginDetails();

            return loginDetails;
        } catch (e) {
            printRustError("Failed to check homeserver capabilities", e);
            throw e;
        }
    }

    /**
     * Get OIDC authorization URL for a given server
     * This initiates the OIDC login flow
     * Expects client to already exist from checkHomeserverCapabilities
     */
    public async getOidcAuthUrl(
        _server: string,
        loginHint?: string,
    ): Promise<OAuthAuthorizationDataInterface> {
        if (!this.client) {
            throw new Error(
                "No client available. Call checkHomeserverCapabilities first.",
            );
        }

        try {
            const oidcConfig = getOidcConfiguration();

            // Use "Consent" prompt for login (Create is broken per element-x-ios)
            const authData = await this.client.urlForOidc(
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
     * Expects client to already exist from checkHomeserverCapabilities
     */
    public async loginWithOidcCallback(
        callbackUrl: string,
        _homeserverUrl: string,
    ): Promise<void> {
        this.snapshot.merge({ clientState: ClientState.LoggingIn });
        this.getSnapshot().loginViewModel?.setLoggingIn(true);

        if (!this.client) {
            throw new Error(
                "No client available. Call checkHomeserverCapabilities first.",
            );
        }

        try {
            this.initializePlatform();
            await this.client.loginWithOidcCallback(callbackUrl);
            console.log("OIDC login successful");
            await this.completeLogin();
        } catch (e) {
            this.handleLoginFailure(e, "OIDC login failed");
            throw e;
        }
    }

    /**
     * Abort an in-progress OIDC login
     * Should be called if the user cancels the login flow
     */
    public async abortOidcLogin(): Promise<void> {
        if (!this.client || !this.oidcAuthData) {
            console.warn("No OIDC login in progress to abort");
            return;
        }

        try {
            await this.client.abortOidcAuth(this.oidcAuthData);
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

        if (!this.client) {
            console.error("Cannot sync without client");
            return;
        }

        try {
            // Set up client delegate to handle auth errors
            const delegateHandle = this.client.setDelegate({
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
                console.error(
                    "Failed to set client delegate - no handle returned",
                );
            }

            const syncServiceBuilder = this.client.syncService();
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

        if (!this.client) return;

        const room = this.client.getRoom(roomId);
        if (!room) return;

        const timelineStore = new TimelineViewModel({ room });
        const memberListStore = new MemberListViewModel({
            roomId,
            client: this.client,
        });

        this.snapshot.merge({
            timelineStore,
            memberListStore,
            currentRoomId: roomId,
        });
    }
}
