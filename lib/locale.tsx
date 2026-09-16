"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translateUI, type Language } from "./ui-copy";
const LocaleContext = createContext<{ language: Language; setLanguage: (value: Language) => void; t: (en: string, zh: string) => string; ui: (text: string) => string }>({ language: "en", setLanguage: () => {}, t: en => en, ui: text => text });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setValue] = useState<Language>("en");
  useEffect(() => {
    try { const saved = localStorage.getItem("pensieve-language"); setValue(saved === "zh-CN" ? "zh-CN" : "en"); } catch { /* Storage can be unavailable in embedded views. */ }
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const setLanguage = (value: Language) => {
    setValue(value);
    try { localStorage.setItem("pensieve-language", value); } catch { /* Keep the in-memory selection. */ }
  };
  return <LocaleContext.Provider value={{ language, setLanguage, t: (en, zh) => language === "zh-CN" ? zh : en, ui: text => translateUI(language, text) }}>{children}</LocaleContext.Provider>;
}
export const useLocale = () => useContext(LocaleContext);
