/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

/**
 * Utility function to clear all IndexedDB databases
 * Run this from the browser console if you need to clean up old databases:
 *
 * Paste this into the console:
 *
 * (async () => {
 *   const databases = await indexedDB.databases();
 *   for (const db of databases) {
 *     if (db.name) {
 *       indexedDB.deleteDatabase(db.name);
 *       console.log('Deleted:', db.name);
 *     }
 *   }
 *   console.log('All IndexedDB databases deleted');
 *   location.reload();
 * })();
 */
export async function clearIndexedDBData(): Promise<void> {
    console.log("Clearing all IndexedDB databases...");

    // Delete all IndexedDB databases
    const databases = await indexedDB.databases();
    for (const db of databases) {
        if (db.name) {
            await new Promise<void>((resolve, reject) => {
                const request = indexedDB.deleteDatabase(db.name!);
                request.onsuccess = () => {
                    console.log(`Deleted database: ${db.name}`);
                    resolve();
                };
                request.onerror = () => {
                    console.error(`Failed to delete: ${db.name}`);
                    reject(request.error);
                };
                request.onblocked = () => {
                    console.warn(`Deletion blocked for: ${db.name}. Close all tabs and try again.`);
                    resolve();
                };
            });
        }
    }

    console.log("All IndexedDB databases deleted");
    console.log("Reloading page...");
    location.reload();
}

// Make it available on window for easy console access
if (typeof window !== "undefined") {
    (window as any).clearIndexedDBData = clearIndexedDBData;
}
