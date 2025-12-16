import type { OidcConfiguration } from "./generated/matrix_sdk_ffi";

export const getOidcConfiguration = (): OidcConfiguration => {
    const currentOrigin = window.location.origin;
    const redirectUri = `${currentOrigin}/oidc/callback`;
    const clientUri = currentOrigin.includes("localhost")
        ? "https://element.io"
        : currentOrigin;

    console.log("OIDC Configuration:");
    console.log("  Redirect URI:", redirectUri);
    console.log("  Client URI:", clientUri);
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
