import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import ar from './locales/ar.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import tr from './locales/tr.json';

export const supportedLanguages = [
  'en',
  'ar',
  'de',
  'es',
  'fr',
  'ja',
  'tr',
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

const resources = {
  en: {
    translation: en,
  },
  ar: {
    translation: ar,
  },
  de: {
    translation: de,
  },
  es: {
    translation: es,
  },
  fr: {
    translation: fr,
  },
  ja: {
    translation: ja,
  },
  tr: {
    translation: tr,
  },
};

function getDeviceLanguage(): SupportedLanguage {
  const languageCode = getLocales()[0]?.languageCode;

  if (
    languageCode &&
    supportedLanguages.includes(languageCode as SupportedLanguage)
  ) {
    return languageCode as SupportedLanguage;
  }

  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),

    fallbackLng: 'en',

    supportedLngs: supportedLanguages,

    // Your JSON uses {count}, {size}, etc.
    // i18next normally expects {{count}}.
    interpolation: {
      escapeValue: false,
      prefix: '{',
      suffix: '}',
    },

    // We want:
    // scanning_screen.title
    // scanning_screen.progress.status.part_1
    keySeparator: '.',

    // Everything is already bundled locally.
    react: {
      useSuspense: false,
    },
  });

export default i18n;