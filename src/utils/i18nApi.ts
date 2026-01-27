/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import {
    I18nApi,
    registerTranslations,
} from "@element-hq/web-shared-components";

/**
 * Dynamically import all translation files using Vite's glob import.
 * This creates a map of language codes to lazy-loaded translation modules.
 */
const translationModules = import.meta.glob<Record<string, string>>(
    "@element-hq/web-shared-components/src/i18n/strings/*.json",
);

/**
 * Map of all available translations, keyed by language code.
 * Extracted from the glob import results.
 */
const translations: Record<string, () => Promise<Record<string, string>>> = {};

// Process the glob imports and extract the language codes from file paths
for (const path in translationModules) {
    const match = path.match(/\/([^/]+)\.json$/);
    if (match) {
        const languageCode = match[1];
        translations[languageCode] = translationModules[path];
    }
}

/**
 * Mapping from short language codes to their corresponding locale file names.
 * Some translation files use extended locale codes (e.g., en_EN, de_DE),
 * so this map provides the necessary translation.
 */
const mappingLanguageToLocale: Record<string, string> = {
    en: "en_EN",
    de: "de_DE",
    nb: "nb_NO",
    pt: "pt_BR",
    mg: "mg_MG",
    zh: "zh_Hans",
};

/**
 * Loads and registers translations for the specified language.
 * @param language
 */
async function loadLanguage(language: string): Promise<void> {
    const fileLanguage = mappingLanguageToLocale[language] || language;
    const translationModule = await translations[fileLanguage]();

    // Vite's glob import returns modules with a default export for JSON files
    const translationData = translationModule.default || translationModule;

    if (!translationData || typeof translationData !== "object") {
        throw new Error(
            `Translation file for language ${language} (${fileLanguage}) not found or invalid`,
        );
    }

    registerTranslations(language, translationData);
}

/**
 * Creates and initializes an I18n API instance with the user's current language.
 *
 * This function:
 * 1. Creates a new I18nApi instance
 * 2. Detects the user's current language preference
 * 3. Loads the appropriate translation file
 * 4. Falls back to English ("en") if the user's language is not available
 */
export async function createI18nApi(): Promise<I18nApi> {
    const i18nApi = new I18nApi();
    const currentLanguage = i18nApi.language;

    try {
        await loadLanguage(currentLanguage);
    } catch (error) {
        // Fallback to en if the current language is not available
        console.warn(
            `Translation for ${currentLanguage} not found, falling back to en`,
            error,
        );
        try {
            await loadLanguage("en");
        } catch (fallbackError) {
            console.error("Failed to load fallback translation", fallbackError);
        }
    }

    return i18nApi;
}
