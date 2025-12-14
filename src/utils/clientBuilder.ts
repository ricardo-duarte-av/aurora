/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import type { ClientInterface, Session as SessionInterface } from "../index.web";
import {
    Client,
    ClientBuilder,
    type ClientBuilderInterface,
    SlidingSyncVersionBuilder,
    SlidingSyncVersion,
    IndexedDbStoreBuilder,
    BackupDownloadStrategy,
} from "../index.web";

interface BaseBuilderOptions {
    setupEncryption?: boolean;
    slidingSync?: "discover" | "proxy" | "none" | "restored";
    passphrase?: string;
    storeName?: string; // Allow custom store name
}

/**
 * Creates an authentication client for login flows
}

import {
    ClientBuilder,
    SlidingSyncVersionBuilder,
    IndexedDbStoreBuilder,
} from "../index.web";

export interface BaseBuilderOptions {
    setupEncryption?: boolean;
    slidingSync: "discover" | "restored";
}

/**
 * Create a base client builder with common configuration
 * This mirrors the Element X iOS baseBuilder pattern
 */
export function createBaseClientBuilder(
    options: BaseBuilderOptions = { setupEncryption: true, slidingSync: "discover" },
): ClientBuilderInterface {
    console.log(`createBaseClientBuilder called with:`, options);
    let builder: ClientBuilderInterface = new ClientBuilder();

    // Add sliding sync configuration
    if (options.slidingSync === "discover") {
        console.log("Configuring sliding sync: DiscoverNative");
        builder = builder.slidingSyncVersionBuilder(
            SlidingSyncVersionBuilder.DiscoverNative,
        );
    } else if (options.slidingSync === "restored") {
        console.log("Sliding sync configuration skipped for restored session");
    }
    // Note: for "restored", we don't add slidingSyncVersionBuilder
    // as it will be configured when restoring the session

    // Configure IndexedDB storage with optional passphrase
    const storeName = options.storeName || "aurora-store";
    const storeBuilder = new IndexedDbStoreBuilder(storeName);
    if (options.passphrase) {
        builder = builder.indexeddbStore(storeBuilder.passphrase(options.passphrase));
    } else {
        builder = builder.indexeddbStore(storeBuilder);
    }

    // Add encryption configuration if requested
    if (options.setupEncryption) {
        builder = builder.autoEnableBackups(true);
        builder = builder.autoEnableCrossSigning(true);
        builder = builder.backupDownloadStrategy(
            BackupDownloadStrategy.AfterDecryptionFailure,
        );
    }

    return builder;
}

/**
 * Generates a random passphrase for IndexedDB encryption
 * Similar to encryptionKeyProvider.generateKey() in element-x-ios
 */
export function generatePassphrase(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
}

/**
 * Generates a unique store ID using UUID
 * Similar to iOS's SessionDirectories init() which uses UUID().uuidString
 */
export function generateStoreId(): string {
    return crypto.randomUUID();
}

/**
 * Creates an authentication client for login flows
 * Each auth session gets a unique store ID (similar to iOS's SessionDirectories with UUID)
 * Returns the client, passphrase, and storeId to be saved with the session
 */
export async function createAuthenticationClient(
    serverNameOrUrl: string,
): Promise<{ client: ClientInterface; passphrase: string; storeId: string }> {
    // Generate passphrase for this authentication session
    const passphrase = generatePassphrase();

    // Generate a unique store ID (similar to iOS's UUID-based session directories)
    const storeId = generateStoreId();

    // Create store name from the ID
    const storeName = `aurora-store-${storeId}`;

    console.log("[createAuthenticationClient] Creating new auth client");
    console.log(`[createAuthenticationClient] - passphrase: ${passphrase}`);
    console.log(`[createAuthenticationClient] - storeId: ${storeId}`);
    console.log(`[createAuthenticationClient] - storeName: ${storeName}`);

    // Create client with unique store and encryption enabled
    const client = await createBaseClientBuilder({
        passphrase,
        setupEncryption: true,
        slidingSync: "discover", // Discover native sliding sync during auth
        storeName
    })
        .serverNameOrHomeserverUrl(serverNameOrUrl)
        .build();

    return { client, passphrase, storeId };
}

/**
 * Validates that the client is using native sliding sync
 * Throws an error if not, as we only support native sliding sync
 */
export function validateNativeSlidingSync(client: ClientInterface): void {
    const version = client.slidingSyncVersion();
    if (version !== SlidingSyncVersion.Native) {
        throw new Error("This homeserver does not support native sliding sync. Please contact your homeserver administrator.");
    }
}

/**
 * Restores a client from a saved session
 * Similar to UserSessionStore pattern in element-x-ios
 *
 * IMPORTANT: Uses the same storeId that was generated during authentication
 * to access the correct isolated IndexedDB store for this user.
 *
 * Throws an error if restoration fails (e.g., wrong passphrase, corrupted store)
 */
export async function restoreClient(
    session: SessionInterface,
    passphrase: string,
    storeId: string,
): Promise<ClientInterface> {
    console.log("[restoreClient] Starting restoration");
    console.log(`[restoreClient] - userId: ${session.userId}`);
    console.log(`[restoreClient] - passphrase: ${passphrase}`);
    console.log(`[restoreClient] - storeId: ${storeId}`);

    // iOS explicitly sets the sliding sync version to .native when restoring
    // See: RestorationToken.swift - slidingSyncVersion: .native
    const sessionWithSlidingSync = {
        ...session,
        slidingSyncVersion: SlidingSyncVersion.Native
    };

    // Use the same store name that was created during authentication
    const storeName = `aurora-store-${storeId}`;
    console.log(`[restoreClient] - storeName: ${storeName}`);

    const builder: ClientBuilderInterface = createBaseClientBuilder({
        slidingSync: "restored", // Don't discover - session already has sliding sync version
        passphrase,
        setupEncryption: true,
        storeName,
    });

    const client = await builder
        .homeserverUrl(session.homeserverUrl)
        .build();

    console.log("Restoring session...");
    await client.restoreSession(sessionWithSlidingSync);
    console.log("Session restored successfully");
    return client;
}

/**
 * Create an authentication client (for login, no encrypted storage yet)
 * This is used during the login flow before we have a recovery key
 */
export async function createAuthClient(homeserverUrl: string) {
    return await createBaseClientBuilder({
        setupEncryption: true,
        slidingSync: "discover",
    })
        .homeserverUrl(homeserverUrl)
        .build();
}

/**
 * Create a client for session restoration with encrypted storage
 * This is used when restoring a saved session with a passphrase (recovery key)
 */
export async function createRestorationClient(
    homeserverUrl: string,
    userId: string,
    passphrase: string,
) {
    return await createBaseClientBuilder({
        setupEncryption: true,
        slidingSync: "restored",
    })
        .homeserverUrl(homeserverUrl)
        .username(userId)
        .indexeddbStore(
            new IndexedDbStoreBuilder("aurora-store").passphrase(passphrase),
        )
        .build();
}
