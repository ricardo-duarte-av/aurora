import type React from "react";
import { useRef } from "react";
import { useEffect, useState } from "react";
import "./App.css";
import type ClientStore from "./ClientStore.tsx";
import { Composer } from "./Composer.tsx";
import type { MemberListStore } from "./MemberList/MemberListStore.tsx";
import MemberListView from "./MemberList/MemberListView.tsx";
import { RoomHeaderView } from "./RoomHeaderView";
import { RoomListFiltersView } from "./RoomListFiltersView";
import { RoomListHeaderView } from "./RoomListHeaderView";
import type RoomListStore from "./RoomListStore.tsx";
import { RoomListView } from "./RoomListView";
import { RoomSearchView } from "./RoomSearchView";
import { SidePanelView } from "./SidePanelView.tsx";
import { SplashView } from "./SplashView.tsx";
import { Timeline } from "./Timeline.tsx";
import type TimelineStore from "./TimelineStore.tsx";
import { useClientStoreContext } from "./context/ClientStoreContext";

console.log("running Client.tsx");

interface ClientProps {
    onAddAccount: () => void;
}

export const Client: React.FC<ClientProps> = ({ onAddAccount }) => {
    const [clientStore] = useClientStoreContext();
    const { rls, mls, tls, currentRoomId, setCurrentRoomId } =
        useStores(clientStore);

    if (!rls) return;
    console.log(
        `rls: ${rls}, tls: ${tls}, mls: ${mls}, currentRoomId: ${currentRoomId}`,
    );
    return (
        <>
            <header className="mx_Header"> </header>
            <section className="mx_Client">
                <nav className="mx_SidePanel">
                    <SidePanelView
                        clientStore={clientStore}
                        onAddAccount={onAddAccount}
                    />
                </nav>
                <nav className="mx_RoomList">
                    <RoomSearchView />
                    {
                        <>
                            <RoomListHeaderView />
                            <RoomListFiltersView store={rls} />
                            <RoomListView
                                vm={rls}
                                currentRoomId={currentRoomId}
                                onRoomSelected={(roomId) => {
                                    setCurrentRoomId(roomId);
                                }}
                            />
                        </>
                    }
                </nav>
                {tls && mls ? (
                    <>
                        <main className="mx_MainPanel">
                            <RoomHeaderView
                                roomListStore={rls}
                                currentRoomId={currentRoomId}
                            />
                            <Timeline
                                timelineStore={tls}
                                currentRoomId={currentRoomId}
                            />
                            <Composer timelineStore={tls} />
                        </main>
                        <MemberListView vm={mls} />
                    </>
                ) : (
                    <SplashView />
                )}
            </section>
        </>
    );
};

type Stores = {
    tls?: TimelineStore;
    rls?: RoomListStore;
    mls?: MemberListStore;
};

function useStores(clientStore: ClientStore) {
    const [currentRoomId, setCurrentRoomId] = useState("");
    const [stores, setStores] = useState<Stores>({});
    const refClientStore = useRef<ClientStore>(clientStore);

    useEffect(() => {
        refClientStore.current = clientStore;
        setStores({
            rls: clientStore.getRoomListStore(),
            tls: undefined,
            mls: undefined,
        });
        setCurrentRoomId("");
    }, [clientStore]);

    useEffect(() => {
        const tls = currentRoomId
            ? refClientStore.current.getTimelineStore(currentRoomId)
            : undefined;
        const mls = currentRoomId
            ? refClientStore.current.getMemberListStore(currentRoomId)
            : undefined;

        setStores((_stores) => ({
            rls: _stores.rls,
            tls,
            mls,
        }));
    }, [currentRoomId]);

    useEffect(() => {
        stores?.rls?.setActiveRoom(currentRoomId);
    }, [stores?.rls, currentRoomId]);

    return {
        currentRoomId,
        setCurrentRoomId,
        ...stores,
    };
}
