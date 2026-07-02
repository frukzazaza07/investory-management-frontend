import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'th', label: 'TH' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language

  return (
    <div className="flex gap-1 px-3 py-2">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
            current === lang.code
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
