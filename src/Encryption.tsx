/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import {
    Glass,
    InlineSpinner,
    TooltipProvider,
    IconButton,
} from "@vector-im/compound-web";
import { useViewModel } from "@element-hq/web-shared-components";
import type React from "react";
import type { EncryptionViewModel } from "./viewmodel/EncryptionViewModel";
import { EncryptionFlow } from "./viewmodel/encryption-view.types";
import LockIcon from "@vector-im/compound-design-tokens/assets/web/icons/lock-solid";
import KeyIcon from "@vector-im/compound-design-tokens/assets/web/icons/key";
import ChevronLeftIcon from "@vector-im/compound-design-tokens/assets/web/icons/chevron-left";
import { ConfirmIdentityScreen } from "./ConfirmIdentityScreen";
import { RecoveryKeyEntryScreen } from "./RecoveryKeyEntryScreen";
import { SetupRecoveryScreen } from "./SetupRecoveryScreen";
import { EnablingRecoveryScreen } from "./EnablingRecoveryScreen";
import { SaveRecoveryKeyScreen } from "./SaveRecoveryKeyScreen";
import { RecoveryCompleteScreen } from "./RecoveryCompleteScreen";
import { ResetIdentityWarningScreen } from "./ResetIdentityWarningScreen";

export interface EncryptionProps {
    encryptionViewModel: EncryptionViewModel;
}

export const Encryption: React.FC<EncryptionProps> = ({
    encryptionViewModel,
}) => {
    const { flow, canGoBack } = useViewModel(encryptionViewModel);

    const renderFlow = () => {
        switch (flow) {
            case EncryptionFlow.Loading:
                return (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "var(--cpd-space-2x)",
                        }}
                    >
                        <InlineSpinner />
                        <p style={{ textAlign: "center" }}>
                            Checking encryption status...
                        </p>
                    </div>
                );
            case EncryptionFlow.ConfirmIdentity:
                return (
                    <ConfirmIdentityScreen
                        encryptionViewModel={encryptionViewModel}
                    />
                );
            case EncryptionFlow.EnterRecoveryKey:
                return (
                    <RecoveryKeyEntryScreen
                        encryptionViewModel={encryptionViewModel}
                    />
                );
            case EncryptionFlow.SetupRecovery:
                return (
                    <SetupRecoveryScreen
                        encryptionViewModel={encryptionViewModel}
                    />
                );
            case EncryptionFlow.EnablingRecovery:
                return (
                    <EnablingRecoveryScreen
                        encryptionViewModel={encryptionViewModel}
                    />
                );
            case EncryptionFlow.SaveRecoveryKey:
                return (
                    <SaveRecoveryKeyScreen
                        encryptionViewModel={encryptionViewModel}
                    />
                );
            case EncryptionFlow.ResetIdentityWarning:
                return (
                    <ResetIdentityWarningScreen
                        encryptionViewModel={encryptionViewModel}
                    />
                );
            case EncryptionFlow.Complete:
                return <RecoveryCompleteScreen />;
        }
    };

    const getTitle = () => {
        switch (flow) {
            case EncryptionFlow.SaveRecoveryKey:
                return "Save Your Recovery Key";
            case EncryptionFlow.EnterRecoveryKey:
                return "Enter recovery key";
            case EncryptionFlow.ConfirmIdentity:
                return "Confirm your identity";
            case EncryptionFlow.ResetIdentityWarning:
                return "Reset your identity?";
            case EncryptionFlow.Complete:
                return "Recovery Enabled";
            default:
                return "Encryption & Security";
        }
    };

    const getSubtitle = () => {
        switch (flow) {
            case EncryptionFlow.EnterRecoveryKey:
                return "Your key storage is currently out of sync.";
            case EncryptionFlow.Loading:
            case EncryptionFlow.SaveRecoveryKey:
            case EncryptionFlow.EnablingRecovery:
            case EncryptionFlow.Complete:
                return null;
            default:
                return "Set up secure messaging and message recovery.";
        }
    };

    const getIcon = () => {
        switch (flow) {
            case EncryptionFlow.EnterRecoveryKey:
            case EncryptionFlow.SaveRecoveryKey:
                return KeyIcon;
            default:
                return LockIcon;
        }
    };

    const handleGoBack = () => {
        encryptionViewModel.goBack();
    };

    const Icon = getIcon();

    return (
        <div className="mx_LoginPage">
            <div className="mx_Login">
                <Glass>
                    <div
                        className="mx_Login_dialog"
                        style={{
                            padding: "var(--cpd-space-5x)",
                            boxSizing: "border-box",
                            overflow: "hidden",
                        }}
                    >
                        <TooltipProvider>
                            {canGoBack && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "var(--cpd-space-6x)",
                                        left: "var(--cpd-space-6x)",
                                    }}
                                >
                                    <IconButton
                                        kind="secondary"
                                        onClick={handleGoBack}
                                        aria-label="Go back"
                                    >
                                        <ChevronLeftIcon />
                                    </IconButton>
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "var(--cpd-space-2x)",
                                    marginBottom: "var(--cpd-space-9x)",
                                }}
                            >
                                <div
                                    style={{
                                        width: "64px",
                                        height: "64px",
                                        borderRadius: "14px",
                                        backgroundColor:
                                            "var(--cpd-color-bg-subtle-secondary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: "var(--cpd-space-2x)",
                                    }}
                                >
                                    <Icon
                                        width="32px"
                                        height="32px"
                                        style={{
                                            color: "var(--cpd-color-icon-secondary)",
                                        }}
                                    />
                                </div>

                                <h2
                                    style={{
                                        textAlign: "center",
                                        margin: 0,
                                        fontSize:
                                            "var(--cpd-font-size-heading-md)",
                                        fontWeight:
                                            "var(--cpd-font-weight-semibold)",
                                    }}
                                >
                                    {getTitle()}
                                </h2>

                                {getSubtitle() && (
                                    <p
                                        style={{
                                            textAlign: "center",
                                            margin: 0,
                                            color: "var(--cpd-color-text-secondary)",
                                        }}
                                    >
                                        {getSubtitle()}
                                    </p>
                                )}
                            </div>

                            {renderFlow()}
                        </TooltipProvider>
                    </div>
                </Glass>
            </div>
        </div>
    );
};
