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
 * Stores Matrix client session (username, token, etc) in localStorage
 */
export class SessionStore {
    private loadSessions() {
        const storedSessions = localStorage.getItem("mx_session_v2");
        if (!storedSessions) return;

        const sessions = JSON.parse(storedSessions);

        const sessionsV2: Record<string, Session> = {};
        for (const key in sessions) {
            sessionsV2[key] = Session.new(sessions[key]);
        }

        console.log("Loaded sessions:", sessionsV2);

        return sessionsV2;
    }

    private migrateSessionV1() {
        const stored = localStorage.getItem("mx_session");
        if (!stored) return;

        const sessionV1 = Session.new(JSON.parse(stored));
        localStorage.setItem(
            "mx_session_v2",
            JSON.stringify({ [sessionV1.userId]: JSON.stringify(sessionV1) }),
        );
        localStorage.removeItem("mx_session");
    }

    load(): Record<string, Session> | undefined {
        this.migrateSessionV1();
        return this.loadSessions();
    }
    save(session: Session): void {
        let sessions = this.loadSessions();
        if (!sessions) sessions = {};

        sessions[session.userId] = session;
        localStorage.setItem("mx_session_v2", JSON.stringify(sessions));
    }

    clear(): void {
        localStorage.removeItem("mx_session_v2");
    }
}
