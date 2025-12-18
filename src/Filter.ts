import {
    RoomListEntriesDynamicFilterKind,
    RoomListEntriesDynamicFilterKind_Tags,
    RoomListFilterCategory,
} from "./generated/matrix_sdk_ffi";

// Special keys for People and Rooms filters since they use Category tag
export const PEOPLE_FILTER_KEY = "Category_People" as const;
export const ROOMS_FILTER_KEY = "Category_Rooms" as const;

type FiltersToBePicked = typeof RoomListEntriesDynamicFilterKind_Tags;

export type SupportedFilters =
    | keyof Pick<
          FiltersToBePicked,
          "NonLeft" | "Unread" | "Favourite" | "Invite"
      >
    | typeof PEOPLE_FILTER_KEY
    | typeof ROOMS_FILTER_KEY;

export const FILTERS = {
    [RoomListEntriesDynamicFilterKind_Tags.NonLeft]: {
        name: "All",
        method: new RoomListEntriesDynamicFilterKind.All({
            filters: [
                new RoomListEntriesDynamicFilterKind.NonLeft(),
                new RoomListEntriesDynamicFilterKind.DeduplicateVersions(),
            ],
        }),
    },
    [RoomListEntriesDynamicFilterKind_Tags.Unread]: {
        name: "Unreads",
        method: new RoomListEntriesDynamicFilterKind.All({
            filters: [
                new RoomListEntriesDynamicFilterKind.Unread(),
                new RoomListEntriesDynamicFilterKind.DeduplicateVersions(),
            ],
        }),
    },
    [PEOPLE_FILTER_KEY]: {
        name: "People",
        method: new RoomListEntriesDynamicFilterKind.All({
            filters: [
                new RoomListEntriesDynamicFilterKind.Category({
                    expect: RoomListFilterCategory.People,
                }),
                new RoomListEntriesDynamicFilterKind.Joined(),
                new RoomListEntriesDynamicFilterKind.DeduplicateVersions(),
            ],
        }),
    },
    [ROOMS_FILTER_KEY]: {
        name: "Rooms",
        method: new RoomListEntriesDynamicFilterKind.All({
            filters: [
                new RoomListEntriesDynamicFilterKind.Category({
                    expect: RoomListFilterCategory.Group,
                }),
                new RoomListEntriesDynamicFilterKind.Joined(),
                new RoomListEntriesDynamicFilterKind.DeduplicateVersions(),
            ],
        }),
    },
    [RoomListEntriesDynamicFilterKind_Tags.Favourite]: {
        name: "Favourites",
        method: new RoomListEntriesDynamicFilterKind.All({
            filters: [
                new RoomListEntriesDynamicFilterKind.Favourite(),
                new RoomListEntriesDynamicFilterKind.DeduplicateVersions(),
            ],
        }),
    },
    [RoomListEntriesDynamicFilterKind_Tags.Invite]: {
        name: "Invites",
        method: new RoomListEntriesDynamicFilterKind.All({
            filters: [
                new RoomListEntriesDynamicFilterKind.Invite(),
                new RoomListEntriesDynamicFilterKind.DeduplicateVersions(),
            ],
        }),
    },
    [RoomListEntriesDynamicFilterKind_Tags.LowPriority]: {
        name: "Low Priority",
        method: new RoomListEntriesDynamicFilterKind.All({
            filters: [
                new RoomListEntriesDynamicFilterKind.LowPriority(),
                new RoomListEntriesDynamicFilterKind.DeduplicateVersions(),
            ],
        }),
    },
};
