import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, SUPPORTED_LANGUAGES, LanguageMeta } from './translations';

interface LanguageContextType {
  locale: string;
  setLocale: (code: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  bcp47: string;
  langMeta: LanguageMeta;
  SUPPORTED_LANGUAGES: LanguageMeta[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<string>(() => {
    return localStorage.getItem('medscribe_locale') || 'en-IN';
  });

  const langMeta = SUPPORTED_LANGUAGES.find(l => l.code === locale) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = langMeta.dir || 'ltr';
    localStorage.setItem('medscribe_locale', locale);
  }, [locale, langMeta]);

  const setLocale = (code: string) => {
    setLocaleState(code);
  };

  const t = (key: string, vars: Record<string, string | number> = {}): string => {
    const dict = translations[locale] || translations['en-IN'];
    let str = dict[key] || translations['en-IN']?.[key] || key;

    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
    });

    return str;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, bcp47: locale, langMeta, SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
