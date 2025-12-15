/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { BaseViewModel } from "@element-hq/web-shared-components";
import type {
    BackupState,
    BackupStateListener,
    ClientInterface,
    EnableRecoveryProgressListener,
    EncryptionInterface,
    IdentityResetHandleInterface,
    RecoveryState,
    RecoveryStateListener,
    TaskHandleInterface,
} from "../index.web.ts";
import { AuthData, AuthDataPasswordDetails } from "../index.web.ts";
import { printRustError } from "../utils";
import type { EncryptionViewSnapshot } from "./encryption-view.types";
import {
    EncryptionFlow,
    IdentityConfirmationAction,
} from "./encryption-view.types";

export interface EncryptionViewActions {
    enableRecovery(): Promise<void>;
    recover(recoveryKey: string): Promise<void>;
    resetRecoveryKey(): Promise<void>;
    showResetWarning(): void;
    confirmReset(): Promise<void>;
    confirmResetWithPassword(password: string): Promise<void>;
    cancelReset(): void;
    dismissRecoveryKey(): void;
    clearError(): void;
    useRecoveryKey(): void;
    showRecoveryKeyEntry(): void;
    goBack(): void;
}

export interface EncryptionViewModelProps {
    client: ClientInterface;
    onRecoveryEnabled?: (recoveryKey: string) => void; // Called when recovery is successfully enabled, passes the recovery key
}

export class EncryptionViewModel
    extends BaseViewModel<EncryptionViewSnapshot, EncryptionViewModelProps>
    implements EncryptionViewActions
{
    private encryption: EncryptionInterface;
    private recoveryStateListener?: TaskHandleInterface;
    private backupStateListener?: TaskHandleInterface;
    private isResettingIdentity: boolean = false;
    private identityResetHandle?: IdentityResetHandleInterface;

    public constructor(props: EncryptionViewModelProps) {
        const encryption = props.client.encryption();

        super(props, {
            flow: EncryptionFlow.Loading,
            recoveryState: encryption.recoveryState(),
            backupState: encryption.backupState(),
            backupExistsOnServer: undefined, // Will be checked asynchronously
            hasDevicesToVerifyAgainst: undefined, // Will be checked asynchronously
            availableActions: undefined, // Will be computed after checks
            enableRecoveryProgress: "",
            recoveryKey: undefined,
            error: undefined,
            canGoBack: false,
            isVerifying: false,
            isResetting: false,
        });

        this.encryption = encryption;
        this.setupListeners();
        this.checkBackupExistsOnServer();
        this.checkHasDevicesToVerifyAgainst();
        this.updateFlow();
    }

    /**
     * Update the flow based on current state
     * Following iOS logic: show ConfirmIdentity when recovery enabled/incomplete
     */
    private updateFlow(): void {
        const snapshot = this.getSnapshot();

        // If we have a recovery key to save, show that screen
        if (snapshot.recoveryKey) {
            this.snapshot.merge({
                flow: EncryptionFlow.SaveRecoveryKey,
                canGoBack: false,
            });
            return;
        }

        // If we're currently enabling recovery, show progress
        if (snapshot.flow === EncryptionFlow.EnablingRecovery) {
            return; // Keep showing progress
        }

        // Don't override manual navigation screens (user explicitly navigated here)
        // These screens are pushed by user actions, not state changes
        if (
            snapshot.flow === EncryptionFlow.ResetIdentityWarning ||
            snapshot.flow === EncryptionFlow.ResetIdentityPassword ||
            snapshot.flow === EncryptionFlow.EnterRecoveryKey
        ) {
            // Exception: If we're on reset warning and recovery becomes disabled,
            // that means reset completed - but ONLY if we're not actively resetting
            if (
                snapshot.flow === EncryptionFlow.ResetIdentityWarning &&
                snapshot.recoveryState === 2 &&
                !this.isResettingIdentity
            ) {
                // Reset completed, recovery is disabled, show setup
                this.snapshot.merge({
                    flow: EncryptionFlow.SetupRecovery,
                    canGoBack: false,
                });
                return;
            }
            return; // Otherwise don't override
        }

        // Still checking initial state
        if (
            snapshot.backupExistsOnServer === undefined ||
            snapshot.hasDevicesToVerifyAgainst === undefined
        ) {
            this.snapshot.merge({
                flow: EncryptionFlow.Loading,
                canGoBack: false,
            });
            return;
        }

        // Compute available actions for ConfirmIdentity screen
        const availableActions: IdentityConfirmationAction[] = [];

        // Show "Use another device" if user has devices to verify against
        if (snapshot.hasDevicesToVerifyAgainst) {
            availableActions.push(
                IdentityConfirmationAction.InteractiveVerification,
            );
        }

        // Show "Use recovery key" if recovery is enabled or incomplete
        // RecoveryState: Unknown=0, Enabled=1, Disabled=2, Incomplete=3
        if (snapshot.recoveryState === 1 || snapshot.recoveryState === 3) {
            availableActions.push(IdentityConfirmationAction.Recovery);
        }

        // If recovery is enabled or incomplete, show ConfirmIdentity (like iOS)
        // This is the key fix: don't show Complete screen automatically
        if (snapshot.recoveryState === 1 || snapshot.recoveryState === 3) {
            this.snapshot.merge({
                flow: EncryptionFlow.ConfirmIdentity,
                availableActions,
                canGoBack: false,
            });
            return;
        }

        // Backup exists but recovery is disabled - show confirm identity
        if (snapshot.backupExistsOnServer) {
            this.snapshot.merge({
                flow: EncryptionFlow.ConfirmIdentity,
                availableActions,
                canGoBack: false,
            });
            return;
        }

        // No backup on server - show ConfirmIdentity (matching iOS)
        // User can choose to verify with another device or reset
        // Only show SetupRecovery after explicit reset action
        this.snapshot.merge({
            flow: EncryptionFlow.ConfirmIdentity,
            availableActions,
            canGoBack: false,
        });
    }

    /**
     * Check if a backup exists on the server
     * This helps us show the right UI (setup vs verify)
     */
    private async checkBackupExistsOnServer(): Promise<void> {
        try {
            const exists = await this.encryption.backupExistsOnServer();
            console.log("Backup exists on server:", exists);
            this.snapshot.merge({ backupExistsOnServer: exists });
            this.updateFlow();
        } catch (e) {
            printRustError("Failed to check if backup exists on server", e);
            // Default to false if we can't check
            this.snapshot.merge({ backupExistsOnServer: false });
            this.updateFlow();
        }
    }

    /**
     * Check if the user has other devices they can verify against
     * This determines if we show "Use another device" option
     */
    private async checkHasDevicesToVerifyAgainst(): Promise<void> {
        try {
            const hasDevices =
                await this.encryption.hasDevicesToVerifyAgainst();
            console.log("Has devices to verify against:", hasDevices);
            this.snapshot.merge({ hasDevicesToVerifyAgainst: hasDevices });
            this.updateFlow();
        } catch (e) {
            printRustError(
                "Failed to check if user has devices to verify against",
                e,
            );
            // Default to false if we can't check
            this.snapshot.merge({ hasDevicesToVerifyAgainst: false });
            this.updateFlow();
        }
    }

    private setupListeners(): void {
        // Listen to recovery state changes
        const recoveryListener: RecoveryStateListener = {
            onUpdate: (status: RecoveryState) => {
                console.log("Recovery state changed:", status);
                this.snapshot.merge({ recoveryState: status });
                this.updateFlow();
            },
        };

        this.recoveryStateListener =
            this.encryption.recoveryStateListener(recoveryListener);

        // Listen to backup state changes
        const backupListener: BackupStateListener = {
            onUpdate: (status: BackupState) => {
                console.log("Backup state changed:", status);
                this.snapshot.merge({ backupState: status });
                this.updateFlow();
            },
        };

        this.backupStateListener =
            this.encryption.backupStateListener(backupListener);
    }

    /**
     * Enable recovery and generate a recovery key
     * This sets up E2EE backup with a recovery key that the user must save
     */
    public async enableRecovery(): Promise<void> {
        this.snapshot.merge({
            flow: EncryptionFlow.EnablingRecovery,
            enableRecoveryProgress: "Starting recovery setup...",
            error: undefined,
        });

        try {
            const progressListener: EnableRecoveryProgressListener = {
                onUpdate: (progress: unknown) => {
                    const tag = (progress as { tag: string }).tag;

                    switch (tag) {
                        case "Starting":
                            this.snapshot.merge({
                                enableRecoveryProgress: "Starting...",
                            });
                            break;
                        case "CreatingBackup":
                            this.snapshot.merge({
                                enableRecoveryProgress: "Creating backup...",
                            });
                            break;
                        case "CreatingRecoveryKey":
                            this.snapshot.merge({
                                enableRecoveryProgress:
                                    "Creating recovery key...",
                            });
                            break;
                        case "BackingUp": {
                            const inner = (
                                progress as {
                                    inner: {
                                        backedUpCount: number;
                                        totalCount: number;
                                    };
                                }
                            ).inner;
                            this.snapshot.merge({
                                enableRecoveryProgress: `Backing up keys: ${inner.backedUpCount}/${inner.totalCount}`,
                            });
                            break;
                        }
                        case "RoomKeyUploadError":
                            this.snapshot.merge({
                                enableRecoveryProgress:
                                    "Error uploading room keys",
                                error: "Failed to upload room keys",
                            });
                            break;
                        case "Done": {
                            const inner = (
                                progress as { inner: { recoveryKey: string } }
                            ).inner;
                            console.log(
                                "Recovery setup complete! Recovery key:",
                                inner.recoveryKey,
                            );
                            this.snapshot.merge({
                                enableRecoveryProgress: "Complete!",
                                recoveryKey: inner.recoveryKey,
                                flow: EncryptionFlow.SaveRecoveryKey,
                            });

                            // Don't call onRecoveryEnabled here - wait for user to dismiss the key
                            // The callback will be triggered in dismissRecoveryKey()
                            break;
                        }
                    }
                },
            };

            // Enable recovery with auto-generated recovery key (passphrase = undefined)
            // waitForBackupsToUpload = false to not block
            await this.encryption.enableRecovery(
                false,
                undefined,
                progressListener,
            );
        } catch (e) {
            printRustError("Failed to enable recovery", e);
            this.snapshot.merge({
                error: "Failed to enable recovery. Please try again.",
            });
            this.updateFlow();
        }
    }

    /**
     * Recover using a recovery key
     * This imports the backup keys using the provided recovery key
     */
    public async recover(recoveryKey: string): Promise<void> {
        this.snapshot.merge({
            error: undefined,
            isVerifying: true,
        });

        try {
            await this.encryption.recover(recoveryKey);
            console.log("Recovery successful");

            this.snapshot.merge({
                isVerifying: false,
                flow: EncryptionFlow.Complete,
            });

            // Notify that recovery is complete (if callback provided)
            // Pass the recovery key so it can be used as the IndexedDB passphrase
            if (this.props.onRecoveryEnabled) {
                this.props.onRecoveryEnabled(recoveryKey);
            }
        } catch (e) {
            printRustError("Failed to recover", e);
            this.snapshot.merge({
                error: "Invalid recovery key. Please try again.",
                isVerifying: false,
            });
            throw e;
        }
    }

    /**
     * Reset the recovery key
     * This generates a new recovery key, invalidating the old one
     */
    public async resetRecoveryKey(): Promise<void> {
        this.snapshot.merge({
            error: undefined,
        });

        try {
            const newRecoveryKey = await this.encryption.resetRecoveryKey();
            console.log("Recovery key reset! New key:", newRecoveryKey);
            this.snapshot.merge({
                recoveryKey: newRecoveryKey,
            });
        } catch (e) {
            printRustError("Failed to reset recovery key", e);
            this.snapshot.merge({
                error: "Failed to reset recovery key. Please try again.",
            });
            throw e;
        }
    }

    /**
     * Show the reset identity warning screen
     */
    public showResetWarning(): void {
        this.snapshot.merge({
            flow: EncryptionFlow.ResetIdentityWarning,
            canGoBack: true,
            error: undefined,
        });
    }

    /**
     * Confirm and proceed with identity reset
     * This resets cross-signing keys, deletes existing backup and recovery key
     */
    public async confirmReset(): Promise<void> {
        this.snapshot.merge({
            error: undefined,
            isResetting: true,
        });

        // Set flag to prevent updateFlow from transitioning during reset
        this.isResettingIdentity = true;

        let popup: Window | null = null;

        try {
            console.log("Resetting identity...");
            const handle = await this.encryption.resetIdentity();

            if (!handle) {
                console.log(
                    "No reset handle returned - reset completed without auth",
                );
                this.isResettingIdentity = false;
                this.snapshot.merge({ isResetting: false });
                // State listeners will handle navigation
                return;
            }

            // Store the handle for later use
            this.identityResetHandle = handle;

            // Check auth type
            const authType = handle.authType();
            console.log("Reset auth type:", authType);

            // Handle different auth types
            if (authType?.tag === "Oidc") {
                // OIDC: Open approval URL in popup, wait for approval, then reset
                const approvalUrl = authType.inner.info.approvalUrl;
                console.log("OIDC reset - opening approval URL:", approvalUrl);

                // Open in popup window (like OIDC login)
                const width = 600;
                const height = 900;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;

                popup = window.open(
                    approvalUrl,
                    "oidc-reset-approval",
                    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`,
                );

                if (!popup) {
                    this.isResettingIdentity = false;
                    this.identityResetHandle = undefined;
                    this.snapshot.merge({
                        error: "Failed to open popup window. Please allow popups for this site.",
                        flow: EncryptionFlow.ResetIdentityWarning,
                        isResetting: false,
                    });
                    return;
                }

                // Popup opened successfully - clear loading state
                this.snapshot.merge({
                    isResetting: false,
                });

                // Call reset - SDK will wait for OIDC authorization internally
                // If user cancels or doesn't complete auth, this will throw
                console.log(
                    "Calling reset - SDK will wait for OIDC authorization",
                );
                await handle.reset(undefined);

                // Success! Close popup and transition to setup recovery
                console.log("OIDC reset complete");
                if (popup && !popup.closed) {
                    popup.close();
                }

                // Clear handle, flag and transition to setup recovery
                this.identityResetHandle = undefined;
                this.isResettingIdentity = false;
                this.snapshot.merge({
                    flow: EncryptionFlow.SetupRecovery,
                    canGoBack: false,
                    isResetting: false,
                });
                return;
            }

            if (authType?.tag === "Uiaa") {
                // Password-based: Navigate to password screen
                this.isResettingIdentity = false;
                this.snapshot.merge({
                    flow: EncryptionFlow.ResetIdentityPassword,
                    canGoBack: true,
                    isResetting: false,
                });
                return;
            }

            // No auth required - proceed with reset
            console.log("Resetting with no auth");
            await handle.reset(undefined);

            console.log("Identity reset complete");

            // Clear flag and manually transition to setup recovery
            this.isResettingIdentity = false;
            this.snapshot.merge({
                flow: EncryptionFlow.SetupRecovery,
                canGoBack: false,
                isResetting: false,
            });
        } catch (e) {
            printRustError("Failed to reset identity", e);

            // Close popup if still open
            if (popup && !popup.closed) {
                popup.close();
            }

            this.identityResetHandle = undefined;
            this.isResettingIdentity = false;
            this.snapshot.merge({
                error: "Reset cancelled or failed. Please try again.",
                flow: EncryptionFlow.ResetIdentityWarning,
                isResetting: false,
            });
        }
    }

    /**
     * Confirm reset with password (UIAA flow)
     */
    public async confirmResetWithPassword(password: string): Promise<void> {
        const handle = this.identityResetHandle;
        if (!handle) {
            this.snapshot.merge({
                error: "Reset session expired. Please try again.",
            });
            return;
        }

        this.snapshot.merge({
            error: undefined,
            isResetting: true,
        });

        // Set flag to prevent updateFlow from transitioning during reset
        this.isResettingIdentity = true;

        try {
            // Get user ID from client
            const userId = this.props.client.userId();
            
            // Create password auth data
            const passwordDetails = AuthDataPasswordDetails.create({
                identifier: userId,
                password: password,
            });
            
            const authData = AuthData.Password.new({ passwordDetails });

            console.log("Resetting with password authentication");
            await handle.reset(authData);

            console.log("Password-based reset complete");

            // Clear handle, flag and transition to setup recovery
            this.identityResetHandle = undefined;
            this.isResettingIdentity = false;
            this.snapshot.merge({
                flow: EncryptionFlow.SetupRecovery,
                canGoBack: false,
                isResetting: false,
            });
        } catch (e) {
            printRustError("Failed to reset identity with password", e);
            
            this.identityResetHandle = undefined;
            this.isResettingIdentity = false;
            this.snapshot.merge({
                error: "Invalid password or reset failed. Please try again.",
                flow: EncryptionFlow.ResetIdentityPassword,
                isResetting: false,
            });
        }
    }

    /**
     * Cancel the reset identity flow and go back
     */
    public cancelReset(): void {
        this.snapshot.merge({
            flow: EncryptionFlow.ConfirmIdentity,
            canGoBack: false,
            error: undefined,
        });
    }

    /**
     * Dismiss the recovery key display (user has saved it)
     * This triggers the callback to proceed to the app
     */
    public dismissRecoveryKey(): void {
        const currentRecoveryKey = this.getSnapshot().recoveryKey;

        this.snapshot.merge({
            recoveryKey: undefined,
            flow: EncryptionFlow.Complete,
        });

        // Now that user has dismissed the key, trigger the callback to proceed
        if (this.props.onRecoveryEnabled && currentRecoveryKey) {
            this.props.onRecoveryEnabled(currentRecoveryKey);
        }
    }

    /**
     * Clear the current error message
     */
    public clearError(): void {
        this.snapshot.merge({
            error: undefined,
            isVerifying: false, // Reset verification state when clearing errors
        });
    }

    /**
     * User wants to use recovery key (from ConfirmIdentity screen)
     */
    public useRecoveryKey(): void {
        this.snapshot.merge({
            flow: EncryptionFlow.EnterRecoveryKey,
            canGoBack: true,
        });
    }

    /**
     * Show recovery key entry screen (alias for useRecoveryKey)
     */
    public showRecoveryKeyEntry(): void {
        this.useRecoveryKey();
    }

    /**
     * Go back to the previous screen in the flow
     */
    public goBack(): void {
        const snapshot = this.getSnapshot();

        // From EnterRecoveryKey, go back to ConfirmIdentity
        if (snapshot.flow === EncryptionFlow.EnterRecoveryKey) {
            this.snapshot.merge({
                flow: EncryptionFlow.ConfirmIdentity,
                error: undefined, // Clear any errors when going back
                isVerifying: false, // Reset verification state when going back
                canGoBack: false,
            });
        }

        // From ResetIdentityWarning, go back to ConfirmIdentity
        if (snapshot.flow === EncryptionFlow.ResetIdentityWarning) {
            this.snapshot.merge({
                flow: EncryptionFlow.ConfirmIdentity,
                error: undefined,
                canGoBack: false,
            });
        }

        // From ResetIdentityPassword, go back to ResetIdentityWarning
        if (snapshot.flow === EncryptionFlow.ResetIdentityPassword) {
            this.snapshot.merge({
                flow: EncryptionFlow.ResetIdentityWarning,
                error: undefined,
                canGoBack: true,
            });
        }
    }

    /**
     * Cleanup listeners when view model is destroyed
     */
    public destroy(): void {
        this.recoveryStateListener?.cancel();
        this.backupStateListener?.cancel();
    }
}
