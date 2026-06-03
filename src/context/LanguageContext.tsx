import { createContext, useContext, useState, type ReactNode } from 'react';
import en, { type Translations } from '../i18n/en';
import nl from '../i18n/nl';

type Lang = 'en' | 'nl';

interface LanguageContextType {
    lang:    Lang;
    setLang: (lang: Lang) => void;
    t:       Translations;
}

const LanguageContext = createContext<LanguageContextType>({
    lang:    'en',
    setLang: () => {},
    t:       en,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLang] = useState<Lang>(() => {
        const browser = navigator.language.split('-')[0];
        return browser === 'nl' ? 'nl' : 'en';
    });

    return (
        <LanguageContext.Provider value={{ lang, setLang, t: lang === 'nl' ? nl : en }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
