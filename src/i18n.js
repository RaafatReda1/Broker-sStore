import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enTranslations from "./locales/en/translation.json";
import arTranslations from "./locales/ar/translation.json";

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language
    fallbackLng: "en",

    // Available languages
    supportedLngs: ["en", "ar"],

    // Namespace configuration
    ns: ["translation"],
    defaultNS: "translation",

    // Resources
    resources: {
      en: {
        translation: enTranslations,
      },
      ar: {
        translation: arTranslations,
      },
    },

    // Detection options
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // React specific options
    react: {
      useSuspense: false,
    },
  });

export default i18n;
