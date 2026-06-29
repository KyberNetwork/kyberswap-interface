import { isMobile } from 'react-device-detect'
import { ArrowLeft, Check } from 'react-feather'
import { useLocation, useNavigate } from 'react-router-dom'

import { ButtonEmpty } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { LOCALE_INFO, SupportedLocale } from 'constants/locales'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useUserLocale } from 'state/user/hooks'
import { cn } from 'utils/cn'

type LanguageSelectorProps = {
  onClose: () => void
  onLanguageChange?: (previousLanguage: string, newLanguage: string) => void
  isInline?: boolean
}

const LanguageSelector = ({ onClose, onLanguageChange, isInline }: LanguageSelectorProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const qs = useParsedQueryString()
  const userLocale = useUserLocale()

  const handleSelectLanguage = (locale: SupportedLocale) => {
    const target = {
      ...location,
      search: new URLSearchParams({ ...qs, lng: locale }).toString(),
    }

    onLanguageChange?.(userLocale ?? '', locale)
    navigate(target)
    onClose()
  }

  return (
    <Stack className={cn('items-start justify-center', !isInline && 'gap-6')}>
      {!isInline && (
        <ButtonEmpty width="fit-content" padding="0" onClick={onClose} className="text-text no-underline">
          <ArrowLeft />
        </ButtonEmpty>
      )}
      <div
        className={cn(
          'grid w-full',
          isInline ? 'gap-2' : 'gap-x-12 gap-y-6',
          isMobile && !isInline ? 'grid-cols-[1fr_1fr]' : 'grid-cols-[1fr]',
        )}
      >
        {Object.keys(LOCALE_INFO).map(element => {
          const locale = element as SupportedLocale
          const localeInfo = LOCALE_INFO[locale]
          const isSelected = locale === userLocale
          return (
            <ButtonEmpty
              key={locale}
              padding={isInline ? '6px 0' : '0'}
              onClick={() => handleSelectLanguage(locale)}
              className={cn(
                'flex items-center justify-between gap-2 no-underline',
                isInline && 'group text-subText hover:text-text',
              )}
            >
              <HStack
                className={cn(
                  'items-center gap-2 whitespace-nowrap text-sm',
                  isSelected ? 'text-primary' : 'text-subText',
                  isInline && !isSelected && 'group-hover:text-text',
                )}
              >
                <img src={localeInfo.flag} alt="" className="w-5 shrink-0" />
                <span>{localeInfo.name}</span>
              </HStack>
              {isSelected && <Check className="shrink-0 text-primary" />}
            </ButtonEmpty>
          )
        })}
      </div>
    </Stack>
  )
}

export default LanguageSelector
