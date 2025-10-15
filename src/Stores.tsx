/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { omit } from "lodash-es";
import {
    type PropsWithChildren,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import ClientStore from "./ClientStore";
import { SessionStore } from "./SessionStore";
import { ClientStoreContext } from "./context/ClientStoreContext";
import {
    type ClientStores,
    ClientStoresContext,
} from "./context/ClientStoresContext";
import { SessionStoreContext } from "./context/SessionStoreContext";

export function Stores({ children }: PropsWithChildren) {
    const [clientStores, setClientStores] = useState<ClientStores>({});

    const [activeClientStore, setActiveClientStore] = useState<ClientStore>();
    const sessionStore = useMemo(() => new SessionStore(), []);

    useEffect(() => {
        const load = async () => {
            const sessions = sessionStore.load();
            console.log("Loaded sessions", sessions);
            if (!sessions || Object.keys(sessions).length === 0) {
                const store = new ClientStore(sessionStore);
                await store.tryLoadSession();
                setActiveClientStore(store);
                return;
            }

            const stores: ClientStores = {};
            for (const session of Object.values(sessions)) {
                const store = new ClientStore(sessionStore, session.userId);
                await store.tryLoadSession();
                stores[session.userId] = store;
            }

            console.log("Loaded stores", stores);

            setClientStores(stores);
            setActiveClientStore(stores[Object.keys(stores)[0]]); // Select the first store as active
        };

        load();
    }, [sessionStore]);

    const addClientStore = useCallback((userId: string, store: ClientStore) => {
        setClientStores((prev) => ({ ...prev, [userId]: store }));
    }, []);

    const removeClientStore = useCallback((userId: string) => {
        setClientStores((prev) => omit(prev, userId));
    }, []);

    if (!activeClientStore) return;

    return (
        <SessionStoreContext.Provider value={sessionStore}>
            <ClientStoresContext.Provider
                value={[clientStores, addClientStore, removeClientStore]}
            >
                <ClientStoreContext.Provider
                    value={[activeClientStore, setActiveClientStore]}
                >
                    {children}
                </ClientStoreContext.Provider>
            </ClientStoresContext.Provider>
        </SessionStoreContext.Provider>
    );
}
