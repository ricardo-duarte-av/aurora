import { Glass, TooltipProvider } from "@vector-im/compound-web";
import { useViewModel } from "@element-hq/web-shared-components";
import type React from "react";
import type { LoginViewModel } from "./viewmodel/LoginViewModel";
import { LoginFlow } from "./viewmodel/login-view.types";
import { ServerInputScreen } from "./ServerInputScreen";
import { OidcLoginScreen } from "./OidcLoginScreen";
import { UsernamePasswordScreen } from "./UsernamePasswordScreen";

export interface LoginProps {
    loginViewModel: LoginViewModel;
}

export const Login: React.FC<LoginProps> = ({ loginViewModel }) => {
    const { flow } = useViewModel(loginViewModel);

    const renderFlow = () => {
        switch (flow) {
            case LoginFlow.ServerInput:
                return <ServerInputScreen loginViewModel={loginViewModel} />;
            case LoginFlow.OIDC:
                return <OidcLoginScreen loginViewModel={loginViewModel} />;
            case LoginFlow.UsernamePassword:
                return (
                    <UsernamePasswordScreen loginViewModel={loginViewModel} />
                );
        }
    };

    return (
        <div className="mx_LoginPage">
            <div className="mx_Login">
                <Glass>
                    <div className="mx_Login_dialog">
                        <TooltipProvider>{renderFlow()}</TooltipProvider>
                    </div>
                </Glass>
            </div>
        </div>
    );
};
