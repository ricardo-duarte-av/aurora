/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { createContext, useContext } from "react";
import type ClientStore from "../ClientStore";

/**
 * A mapping of user IDs to their respective ClientStore instances.
 */
export type ClientStores = Record<string, ClientStore>;
type ContextType = [
    ClientStores,
    (userId: string, stores: ClientStore) => void,
];

export const ClientStoresContext = createContext<ContextType>(
    null as unknown as ContextType,
);
ClientStoresContext.displayName = "ClientStoresContext";

export function useClientStoresContext(): ContextType {
    return useContext(ClientStoresContext);
}
