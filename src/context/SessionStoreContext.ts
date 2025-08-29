/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { createContext, useContext } from "react";
import type { SessionStore } from "../SessionStore";

export const SessionStoreContext = createContext<SessionStore>(
    null as unknown as SessionStore,
);
SessionStoreContext.displayName = "ClientStoreContext";

export function useSessionStoreContext(): SessionStore {
    return useContext(SessionStoreContext);
}
