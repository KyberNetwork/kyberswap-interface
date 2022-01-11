export const SUPPORTED_LOCALES = ['en-US', 'ko-KR', 'tr-TR', 'vi-VN', 'zh-CN'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en-US'

export const LOCALE_LABEL: { [locale in SupportedLocale]: string } = {
  'en-US': '🇬🇧 \u00A0English',
  'zh-CN': '🇨🇳 \u00A0中文',
  'tr-TR': '🇹🇷 \u00A0Türkçe',
  'ko-KR': '🇰🇷 \u00A0한국어',
  'vi-VN': '🇻🇳 \u00A0Tiếng Việt'
}
