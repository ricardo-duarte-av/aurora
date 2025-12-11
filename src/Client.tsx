import type React from "react";
import { useEffect } from "react";
import "./App.css";
import { useViewModel } from "@element-hq/web-shared-components";
import { Composer } from "./Composer.tsx";
import MemberListView from "./MemberList/MemberListView.tsx";
import { RoomHeaderView } from "./RoomHeaderView";
import { RoomListFiltersView } from "./RoomListFiltersView";
import { RoomListHeaderView } from "./RoomListHeaderView";
import { RoomListView } from "./RoomListView";
import { RoomSearchView } from "./RoomSearchView";
import { SidePanelView } from "./SidePanelView.tsx";
import { SplashView } from "./SplashView.tsx";
import { Timeline } from "./Timeline.tsx";
import { useClientStoreContext } from "./context/ClientStoreContext";

console.log("running Client.tsx");

interface ClientProps {
    onAddAccount: () => void;
}

export const Client: React.FC<ClientProps> = ({ onAddAccount }) => {
    const [clientViewModel] = useClientStoreContext();
    const { roomListStore, timelineStore, memberListStore, currentRoomId } =
        useViewModel(clientViewModel);

    // Initialize room list store on mount
    useEffect(() => {
        clientViewModel.initializeRoomListStore();
    }, [clientViewModel]);

    // Handle room changes
    const handleRoomSelected = (roomId: string) => {
        clientViewModel.setCurrentRoom(roomId);
    };

    // Update active room in room list store
    useEffect(() => {
        if (roomListStore && currentRoomId) {
            roomListStore.setActiveRoom(currentRoomId);
        }
    }, [roomListStore, currentRoomId]);

    if (!roomListStore) return null;

    console.log(
        `roomListStore: ${roomListStore}, timelineStore: ${timelineStore}, memberListStore: ${memberListStore}, currentRoomId: ${currentRoomId}`,
    );

    return (
        <>
            <header className="mx_Header"> </header>
            <section className="mx_Client">
                <nav className="mx_SidePanel">
                    <SidePanelView
                        clientStore={clientViewModel}
                        onAddAccount={onAddAccount}
                    />
                </nav>
                <nav className="mx_RoomList">
                    <RoomSearchView />
                    {
                        <>
                            <RoomListHeaderView />
                            <RoomListFiltersView store={roomListStore} />
                            <RoomListView
                                vm={roomListStore}
                                currentRoomId={currentRoomId ?? ""}
                                onRoomSelected={handleRoomSelected}
                            />
                        </>
                    }
                </nav>
                {timelineStore && memberListStore ? (
                    <>
                        <main className="mx_MainPanel">
                            <RoomHeaderView
                                roomListStore={roomListStore}
                                currentRoomId={currentRoomId ?? ""}
                            />
                            <Timeline
                                timelineStore={timelineStore}
                                currentRoomId={currentRoomId ?? ""}
                            />
                            <Composer timelineStore={timelineStore} />
                        </main>
                        <MemberListView vm={memberListStore} />
                    </>
                ) : (
                    <SplashView />
                )}
            </section>
        </>
    );
};
