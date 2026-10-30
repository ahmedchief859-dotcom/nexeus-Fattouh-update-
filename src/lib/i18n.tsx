'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type Locale = 'en' | 'ar' | 'de'

type I18nValue = {
  locale: Locale
  direction: 'ltr' | 'rtl'
  toggleLocale: () => void
  t: (english: string, arabic: string, german?: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')
  const value = useMemo<I18nValue>(() => ({
    locale,
    direction: locale === 'ar' ? 'rtl' : 'ltr',
    toggleLocale: () => setLocale((current) => current === 'en' ? 'ar' : current === 'ar' ? 'de' : 'en'),
    t: (english, arabic, german = english) => locale === 'ar' ? arabic : locale === 'de' ? german : english,
  }), [locale])
  return <I18nContext.Provider value={value}><div dir={value.direction} lang={locale}>{children}</div></I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return value
}
