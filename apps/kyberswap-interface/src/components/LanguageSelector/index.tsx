import { isMobile } from 'react-device-detect'
import { ArrowLeft, Check } from 'react-feather'
import { useLocation, useNavigate } from 'react-router-dom'

import { HStack, Stack } from 'components/Stack'
import { DEFAULT_LOCALE, LOCALE_INFO, SupportedLocale } from 'constants/locales'
import { useUserLocale } from 'state/user/hooks'
import { cn } from 'utils/cn'

const LOCALES = Object.keys(LOCALE_INFO) as SupportedLocale[]

type LanguageSelectorProps = {
  onDismiss?: () => void
  onLanguageChange?: (previousLanguage: string, newLanguage: string) => void
  variant?: 'standalone' | 'menu'
}

const LanguageSelector = ({ onDismiss, onLanguageChange, variant = 'standalone' }: LanguageSelectorProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const userLocale = useUserLocale()
  const selectedLocale = userLocale || DEFAULT_LOCALE
  const isMenu = variant === 'menu'

  const handleSelectLanguage = (locale: SupportedLocale) => {
    if (locale !== selectedLocale) {
      const searchParams = new URLSearchParams(location.search)
      searchParams.set('lng', locale)

      onLanguageChange?.(selectedLocale, locale)
      navigate({
        ...location,
        search: searchParams.toString(),
      })
    }

    onDismiss?.()
  }

  return (
    <Stack className={cn(isMenu ? 'pl-4' : 'items-start justify-center gap-6')}>
      {!isMenu && onDismiss && (
        <button type="button" onClick={onDismiss} className="cursor-pointer border-0 bg-transparent p-0 text-text">
          <ArrowLeft />
        </button>
      )}
      <div
        className={cn(
          'grid w-full',
          !isMenu && 'gap-x-12 gap-y-6',
          isMobile && !isMenu ? 'grid-cols-[1fr_1fr]' : 'grid-cols-[1fr]',
        )}
      >
        {LOCALES.map(locale => {
          const localeInfo = LOCALE_INFO[locale]
          const isSelected = locale === selectedLocale

          return (
            <button
              type="button"
              key={locale}
              onClick={() => handleSelectLanguage(locale)}
              className={cn(
                'group flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent text-left outline-none transition-colors',
                isMenu
                  ? 'px-0 py-2.5 text-sm text-subText hover:text-text focus:text-text'
                  : 'p-0 text-sm text-subText',
                isSelected && '!text-primary',
              )}
            >
              <HStack
                className={cn(
                  'items-center gap-2 whitespace-nowrap',
                  isSelected ? 'text-primary' : 'text-subText group-hover:text-text group-focus:text-text',
                )}
              >
                <img src={localeInfo.flag} alt="" className="w-5 shrink-0" />
                <span>{localeInfo.name}</span>
              </HStack>
              {isSelected && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          )
        })}
      </div>
    </Stack>
  )
}

export default LanguageSelector
