/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

export abstract class StateStore<S> {
    protected state: S;
    private listeners = new Set<() => void>();

    constructor(initialState: S) {
        this.state = initialState;
    }

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    protected setState(newState: S): void {
        this.state = newState;
        this.notifyListeners();
    }

    protected notifyListeners(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }

    get viewState(): S {
        return this.state;
    }
}
