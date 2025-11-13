import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traduções
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import esES from './locales/es-ES.json';
import frFR from './locales/fr-FR.json';
import deDE from './locales/de-DE.json';
import itIT from './locales/it-IT.json';
import jaJP from './locales/ja-JP.json';
import zhCN from './locales/zh-CN.json';
import koKR from './locales/ko-KR.json';
import ruRU from './locales/ru-RU.json';
import arSA from './locales/ar-SA.json';
import hiIN from './locales/hi-IN.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
  'fr-FR': { translation: frFR },
  'de-DE': { translation: deDE },
  'it-IT': { translation: itIT },
  'ja-JP': { translation: jaJP },
  'zh-CN': { translation: zhCN },
  'ko-KR': { translation: koKR },
  'ru-RU': { translation: ruRU },
  'ar-SA': { translation: arSA },
  'hi-IN': { translation: hiIN },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    lng: localStorage.getItem('language') || 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
