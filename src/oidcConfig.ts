import type { OidcConfiguration } from "./generated/matrix_sdk_ffi";

export const getOidcConfiguration = (): OidcConfiguration => {
    const redirectUri = `${window.location.origin}/oidc/callback`;
    const clientUri = "https://element.io";

    return {
        clientName: "Aurora",
        redirectUri,
        clientUri,
        logoUri: undefined,
        tosUri: undefined,
        policyUri: undefined,
        staticRegistrations: new Map(),
    };
};
