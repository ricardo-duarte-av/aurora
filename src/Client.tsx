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
import { RoomView } from "./RoomView";
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
    const { roomListViewModel, roomViewModel } = useViewModel(clientViewModel);

    // Handle room changes
    const handleRoomSelected = (roomId: string) => {
        clientViewModel.setCurrentRoom(roomId);
    };

    if (!roomListViewModel) return null;

    console.log(
        `roomListViewModel: ${roomListViewModel}, roomViewModel: ${roomViewModel}`,
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
                            <RoomListFiltersView vm={roomListViewModel} />
                            <RoomListView
                                vm={roomListViewModel}
                                onRoomSelected={handleRoomSelected}
                            />
                        </>
                    }
                </nav>
                {roomViewModel ? (
                    <RoomView roomViewModel={roomViewModel} />
                ) : (
                    <SplashView />
                )}
            </section>
        </>
    );
};
