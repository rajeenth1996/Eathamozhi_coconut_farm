'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, TranslationKey, Language } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  isTamil: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Read saved preference on client mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('eathamozhi_lang') as Language;
      if (savedLang === 'en' || savedLang === 'ta') {
        setLanguageState(savedLang);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = savedLang;
        }
      }
    } catch {
      // LocalStorage might fail in restricted or private browsing modes
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('eathamozhi_lang', lang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === 'en' ? 'ta' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = translations[language];
    if (dict && key in dict) {
      return (dict as Record<string, string>)[key];
    }
    const fallbackDict = translations.en;
    if (fallbackDict && key in fallbackDict) {
      return (fallbackDict as Record<string, string>)[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        isTamil: language === 'ta',
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en' as Language,
      isTamil: false,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: TranslationKey, fallback?: string) => fallback || key,
    };
  }
  return context;
}

export function Trans({ en, ta }: { en: React.ReactNode; ta: React.ReactNode }) {
  const { isTamil } = useLanguage();
  return <>{isTamil ? ta : en}</>;
}
