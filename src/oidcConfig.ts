import type { OidcConfiguration } from "./generated/matrix_sdk_ffi";

/**
 * OIDC Configuration for Aurora
 * Based on element-x-ios implementation
 */
export const getOidcConfiguration = (): OidcConfiguration => {
    const redirectUri = `${window.location.origin}/oidc/callback`;

    // Use the Element website URL for clientUri
    // OIDC providers require a valid public URL, not localhost
    // The redirect URI can still be localhost for development
    const clientUri = "https://element.io";

    return {
        clientName: "Aurora",
        redirectUri,
        clientUri,
        logoUri: undefined, // Can be set to a logo URL if needed
        tosUri: undefined, // Terms of service URL
        policyUri: undefined, // Privacy policy URL
        // Static registrations for known providers that don't support dynamic registration
        // Format: Map<homeserver_url, client_id>
        staticRegistrations: new Map(),
    };
};
