import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import th from './locales/th'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    th: { translation: th },
  },
  lng: localStorage.getItem('lang') ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('lang', lng)
})

export default i18n
