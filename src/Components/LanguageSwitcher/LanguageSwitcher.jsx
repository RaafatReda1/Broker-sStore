import React from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";
import "./LanguageSwitcher.css";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);

    // Update document direction for RTL support
    if (languageCode === "ar") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
    }
  };

  return (
    <div className="language-switcher">
      <div className="language-switcher-trigger">
        <Globe size={16} />
        <span className="current-language">
          {currentLanguage.flag} {currentLanguage.name}
        </span>
        <ChevronDown size={14} />
      </div>

      <div className="language-switcher-dropdown">
        {languages.map((language) => (
          <button
            key={language.code}
            className={`language-option ${
              i18n.language === language.code ? "active" : ""
            }`}
            onClick={() => changeLanguage(language.code)}
          >
            <span className="language-flag">{language.flag}</span>
            <span className="language-name">{language.name}</span>
            {i18n.language === language.code && (
              <span className="checkmark">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
