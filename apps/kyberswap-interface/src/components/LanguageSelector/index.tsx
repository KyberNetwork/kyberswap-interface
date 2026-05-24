import { isMobile } from 'react-device-detect'
import { ArrowLeft, Check } from 'react-feather'
import { useLocation, useNavigate } from 'react-router-dom'

import { ButtonEmpty } from 'components/Button'
import { LOCALE_INFO, SupportedLocale, getLocaleLabel } from 'constants/locales'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useUserLocale } from 'state/user/hooks'
import { cn } from 'utils/cn'

export default function LanguageSelector({
  setIsSelectingLanguage,
  onLanguageChange,
}: {
  setIsSelectingLanguage: (isSelectingLanguage: boolean) => void
  onLanguageChange?: (previousLanguage: string, newLanguage: string) => void
}) {
  const theme = useTheme()
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
    setIsSelectingLanguage(false)
  }

  return (
    <div className="flex flex-col items-start justify-center">
      <ButtonEmpty
        width="fit-content"
        padding="0"
        onClick={() => setIsSelectingLanguage(false)}
        style={{ textDecoration: 'none', color: theme.text, marginBottom: '24px' }}
      >
        <ArrowLeft />
      </ButtonEmpty>
      <div className={cn('grid w-full gap-x-12 gap-y-6', isMobile ? 'grid-cols-[1fr_1fr]' : 'grid-cols-[1fr]')}>
        {Object.keys(LOCALE_INFO).map(element => {
          const locale = element as SupportedLocale
          const isSelected = locale === userLocale
          return (
            <ButtonEmpty
              key={locale}
              padding="0"
              onClick={() => handleSelectLanguage(locale)}
              style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between' }}
            >
              <div className={cn('text-sm', isSelected ? 'text-primary' : 'text-subText')}>
                {getLocaleLabel(locale)}
              </div>
              {isSelected && <Check className="text-primary" />}
            </ButtonEmpty>
          )
        })}
      </div>
    </div>
  )
}
