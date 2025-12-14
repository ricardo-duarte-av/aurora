/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { Session } from "./generated/matrix_sdk_ffi";

/**
 * Extended session data that includes the database encryption passphrase
 * and the unique store identifier for IndexedDB isolation
 */
export interface SessionData {
    session: Session;
    passphrase: string;
    /** Unique identifier for the IndexedDB store (e.g., "abc123") */
    storeId: string;
}

/**
 * Stores Matrix client session (username, token, etc) and database passphrase in localStorage
 */
export class SessionStore {
    private loadSessions() {
        const storedSessions = localStorage.getItem("mx_session_v3");
        if (!storedSessions) return;

        const sessions = JSON.parse(storedSessions);

        const sessionsV3: Record<string, SessionData> = {};
        for (const key in sessions) {
            const data = sessions[key];
            sessionsV3[key] = {
                session: Session.new(data.session),
                passphrase: data.passphrase,
                storeId: data.storeId || this.generateStoreId(), // Migrate old sessions without storeId
            };
        }

        return sessionsV3;
    }

    private generateStoreId(): string {
        // Generate a UUID for the store ID, matching iOS's UUID().uuidString approach
        // See: SessionDirectories.swift - init() uses UUID().uuidString
        return crypto.randomUUID();
    }

    private async clearOldSessions() {
        if (localStorage.getItem("mx_session")) {
            localStorage.removeItem("mx_session");
        }
        if (localStorage.getItem("mx_session_v2")) {
            localStorage.removeItem("mx_session_v2");
        }
    }

    async load(): Promise<Record<string, SessionData> | undefined> {
        await this.clearOldSessions();
        return this.loadSessions();
    }

    save(session: Session, passphrase?: string, storeId?: string): void {
        let sessions = this.loadSessions();
        if (!sessions) sessions = {};

        // If no passphrase provided, use the existing one
        const finalPassphrase =
            passphrase ?? sessions[session.userId]?.passphrase;

        if (!finalPassphrase) {
            throw new Error(
                `No passphrase provided and no existing passphrase found for user ${session.userId}`,
            );
        }

        // If no storeId provided, use the existing one or generate a new one
        const finalStoreId =
            storeId ??
            sessions[session.userId]?.storeId ??
            this.generateStoreId();

        console.log(`[SessionStore] Saving session for ${session.userId}`);

        sessions[session.userId] = {
            session,
            passphrase: finalPassphrase,
            storeId: finalStoreId,
        };
        localStorage.setItem("mx_session_v3", JSON.stringify(sessions));
    }

    async clear(userId: string): Promise<void> {
        const sessions = this.loadSessions();
        if (!sessions) return;

        // Delete the IndexedDB store for this user before clearing session data
        const storeId = sessions[userId]?.storeId;
        if (storeId) {
            await this.deleteStore(storeId);
        }

        delete sessions[userId];
        localStorage.setItem("mx_session_v3", JSON.stringify(sessions));
    }

    /**
     * Get the passphrase for a specific user
     */
    getPassphrase(userId: string): string | undefined {
        const sessions = this.loadSessions();
        return sessions?.[userId]?.passphrase;
    }

    /**
     * Delete an IndexedDB store by its ID
     * Similar to iOS's SessionDirectories.delete()
     */
    private async deleteStore(storeId: string): Promise<void> {
        const storeName = `aurora-store-${storeId}`;
        console.log(`Deleting IndexedDB store: ${storeName}`);

        return new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase(storeName);

            request.onsuccess = () => {
                console.log(`Successfully deleted store: ${storeName}`);
                resolve();
            };

            request.onerror = () => {
                console.error(
                    `Failed to delete store: ${storeName}`,
                    request.error,
                );
                // Don't reject - we still want to clear the session even if DB deletion fails
                resolve();
            };

            request.onblocked = () => {
                console.warn(
                    `Deletion blocked for store: ${storeName}. Close all tabs and try again.`,
                );
                // Don't reject - we still want to clear the session
                resolve();
            };
        });
    }

    /**
     * Delete a store by ID (public method for cleanup on failed restore)
     */
    async deleteStoreById(storeId: string): Promise<void> {
        await this.deleteStore(storeId);
    }
}
