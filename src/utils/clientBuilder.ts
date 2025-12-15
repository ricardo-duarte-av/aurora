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
    ClientBuilder,
    type ClientBuilderInterface,
    SlidingSyncVersionBuilder,
    SlidingSyncVersion,
    IndexedDbStoreBuilder,
    BackupDownloadStrategy,
} from "../index.web";

interface BaseBuilderOptions {
    setupEncryption?: boolean;
    slidingSync: "discover" | "restored";
    passphrase?: string;
    storeName?: string;
}

/**
 * Create a base client builder with common configuration
 * This mirrors the Element X iOS baseBuilder pattern
 */
function createBaseClientBuilder(
    options: BaseBuilderOptions,
): ClientBuilderInterface {
    let builder: ClientBuilderInterface = new ClientBuilder();

    // Add sliding sync configuration
    if (options.slidingSync === "discover") {
        builder = builder.slidingSyncVersionBuilder(
            SlidingSyncVersionBuilder.DiscoverNative,
        );
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
        builder = builder.autoEnableCrossSigning(true);
        builder = builder.backupDownloadStrategy(
            BackupDownloadStrategy.AfterDecryptionFailure,
        );
        // Note: We don't use autoEnableBackups(true) because we want to manually
        // set up recovery and capture the recovery key to use as the IndexedDB passphrase
    }

    return builder;
}

/**
 * Generates a random passphrase for IndexedDB encryption
 * Similar to encryptionKeyProvider.generateKey() in element-x-ios
 */
function generatePassphrase(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
}

/**
 * Generates a unique store ID using UUID
 * Similar to iOS's SessionDirectories init() which uses UUID().uuidString
 */
function generateStoreId(): string {
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
        slidingSync: "discover",
        storeName,
    })
        .serverNameOrHomeserverUrl(serverNameOrUrl)
        .build();

    return { client, passphrase, storeId };
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
        slidingSyncVersion: SlidingSyncVersion.Native,
    };

    // Use the same store name that was created during authentication
    const storeName = `aurora-store-${storeId}`;
    console.log(`[restoreClient] - storeName: ${storeName}`);

    const builder: ClientBuilderInterface = createBaseClientBuilder({
        slidingSync: "restored",
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
 * Validates that the client is using native sliding sync
 * Throws an error if not, as we only support native sliding sync
 */
export function validateNativeSlidingSync(client: ClientInterface): void {
    const version = client.slidingSyncVersion();
    if (version !== SlidingSyncVersion.Native) {
        throw new Error(
            "This homeserver does not support native sliding sync. Please contact your homeserver administrator.",
        );
    }
}
