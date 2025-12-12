/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { BaseViewModel } from "@element-hq/web-shared-components";
import { MemberListStore } from "../MemberList/MemberListStore";
import TimelineStore from "../TimelineStore";
import {
    ClientBuilder,
    type ClientInterface,
    LogLevel,
    type RoomListServiceInterface,
    SlidingSyncVersionBuilder,
    type SyncServiceInterface,
    initPlatform,
} from "../index.web.ts";
import { printRustError } from "../utils.ts";
import {
    ClientState,
    type ClientViewActions,
    type ClientViewSnapshot,
    type LoginParams,
    type Props,
} from "./client-view.types";
import { RoomListViewModel } from "./RoomListViewModel";

export class ClientViewModel
    extends BaseViewModel<ClientViewSnapshot, Props>
    implements ClientViewActions
{
    private syncService?: SyncServiceInterface;
    private roomListService?: RoomListServiceInterface;

    public constructor(props: Props) {
        super(props, {
            clientState: ClientState.Unknown,
            client: undefined,
            timelineStore: undefined,
            roomListViewModel: undefined,
            memberListStore: undefined,
            userId: undefined,
            displayName: undefined,
            avatarUrl: undefined,
            currentRoomId: undefined,
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
        });
    }

    public async login({
        username,
        password,
        server,
    }: LoginParams): Promise<void> {
        this.snapshot.merge({ clientState: ClientState.LoggingIn });

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

            // Notify parent that login completed
            if (this.props.onLogin && userId) {
                this.props.onLogin(userId, this);
            }
        } catch (e) {
            printRustError("login failed", e);
            this.snapshot.merge({ clientState: ClientState.Unknown });
            return;
        }

        await this.sync();
    }

    private async sync(): Promise<void> {
        this.registerServiceWorker();

        const client = this.getSnapshot().client;
        if (!client) {
            console.error("Cannot sync without client");
            return;
        }

        try {
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
            roomListViewModel.run();

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

        const currentTimeline = this.getSnapshot().timelineStore;
        if (currentTimeline?.room.id() === roomId) return;

        currentTimeline?.stop();

        const client = this.getSnapshot().client;
        if (!client) return;

        const room = client.getRoom(roomId);
        if (!room) return;

        const timelineStore = new TimelineStore(room);
        timelineStore.run();

        const memberListStore = new MemberListStore(roomId, client);
        memberListStore.run();

        this.snapshot.merge({
            timelineStore,
            memberListStore,
            currentRoomId: roomId,
        });
    }

}
